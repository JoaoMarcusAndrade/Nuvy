import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Usuarios, Responsaveis, Controle } from "./models.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Arquivos estáticos
router.use(express.static(path.join(__dirname, 'public')));

// Middleware para verificar autenticação
const checkAuthentication = async (req, res, next) => {
  try {
    const usuarioId = req.cookies.usuarioId;
    const responsavelId = req.cookies.responsavelId;

    if (usuarioId) {
      const usuario = await Usuarios.findByPk(usuarioId);
      if (usuario) {
        req.usuario = usuario;
        return next();
      }
    }

    if (responsavelId) {
      const responsavel = await Responsaveis.findByPk(responsavelId);
      if (responsavel) {
        req.responsavel = responsavel;
        return next();
      }
    }

    res.status(401).json({ error: 'Não autenticado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar autenticação' });
  }
};

// Rotas SPA
const spaRoutes = [
  '/', '/login', '/cadastro', '/login/responsavel', '/cadastro/responsavel', '/jogos'
];

spaRoutes.forEach(route => {
  router.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
});

// Verifica autenticação
router.get("/check-auth", async (req, res) => {
  try {
    const usuarioId = req.cookies.usuarioId;
    const responsavelId = req.cookies.responsavelId;

    let usuario = null;
    let responsavel = null;

    if (usuarioId) usuario = await Usuarios.findByPk(usuarioId);
    if (responsavelId) responsavel = await Responsaveis.findByPk(responsavelId);

    if (usuario || responsavel) {
      res.json({ authenticated: true, usuario, responsavel });
    } else {
      res.json({ authenticated: false });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar autenticação' });
  }
});

// Rota protegida para jogos
router.get("/api/jogos", checkAuthentication, (req, res) => {
  res.json({ jogos: [] });
});

router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    const usuario = await Usuarios.findOne({ where: { email_user: email } });

    if (!usuario) return res.status(404).json({ msg: "Usuário não encontrado" });
    if (usuario.password_user !== senha) return res.status(401).json({ msg: "Senha incorreta" });

    // Se menor de 16 anos e não vinculado
    if (usuario.idade < 16 && !usuario.responsavel_vinculado) {
      return res.status(403).json({
        msg: "Usuário menor de idade precisa cadastrar ou vincular um responsável.",
        requireResponsavel: true,
        idUsuario: usuario.ID_usuarios // envia ID para front
      });
    }

    // Usuário maior ou menor já vinculado → login normal
    res.cookie('usuarioId', usuario.ID_usuarios, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ msg: "Login bem-sucedido", usuario });

  } catch (err) {
    res.status(500).json({ msg: "Erro no login", erro: err.message });
  }
});


router.post("/login/responsavel", async (req, res) => {
  try {
    const { email, senha, idUsuarioParaVinculo } = req.body;
    const responsavel = await Responsaveis.findOne({ where: { email_resp: email } });

    if (!responsavel) return res.status(404).json({ msg: "Responsável não encontrado" });
    if (responsavel.password_resp !== senha) return res.status(401).json({ msg: "Senha incorreta" });

    res.cookie('responsavelId', responsavel.ID_responsaveis, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000
    });

    // Cria vínculo se vier ID do usuário menor
    if (idUsuarioParaVinculo) {
      const usuario = await Usuarios.findByPk(idUsuarioParaVinculo);
      if (usuario && usuario.idade < 16 && !usuario.responsavel_vinculado) {
        await Controle.create({
          ID_usuarios: usuario.ID_usuarios,
          ID_responsaveis: responsavel.ID_responsaveis
        });
        usuario.responsavel_vinculado = true;
        await usuario.save();
      }
    }

    res.json({ msg: "Login do responsável bem-sucedido", responsavel });

  } catch (err) {
    res.status(500).json({ msg: "Erro no login do responsável", erro: err.message });
  }
});

// ---------- CADASTRO USUÁRIO ----------
router.post("/cadastro", async (req, res) => {
  try {
    const { email, senha, nome, idade } = req.body;
    const existe = await Usuarios.findOne({ where: { email_user: email } });
    if (existe) return res.status(400).json({ msg: "E-mail já cadastrado" });

    const novo = await Usuarios.create({
      email_user: email,
      password_user: senha,
      name_user: nome,
      idade,
      responsavel_vinculado: idade >= 16
    });

    res.cookie('usuarioId', novo.ID_usuarios, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ msg: "Usuário cadastrado com sucesso", usuario: novo });
  } catch (err) {
    res.status(500).json({ msg: "Erro no cadastro de usuário", erro: err.message });
  }
});

// ---------- CADASTRO RESPONSÁVEL ----------
router.post("/cadastro/responsavel", async (req, res) => {
  try {
    const { email, senha } = req.body;
    const existe = await Responsaveis.findOne({ where: { email_resp: email } });
    if (existe) return res.status(400).json({ msg: "E-mail já cadastrado" });

    const novo = await Responsaveis.create({ email_resp: email, password_resp: senha });

    res.cookie('responsavelId', novo.ID_responsaveis, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ msg: "Responsável cadastrado com sucesso", responsavel: novo });
  } catch (err) {
    res.status(500).json({ msg: "Erro no cadastro de responsável", erro: err.message });
  }
});

// ---------- VINCULAR USUÁRIO E RESPONSÁVEL ----------
router.post("/vincular", async (req, res) => {
  try {
    const { idUsuario, idUsuarioParaVinculo , idResponsavel } = req.body;
    const usuarioId = idUsuario || idUsuarioParaVinculo;
    if (!usuarioId || !idResponsavel) return res.status(400).json({ msg: "IDs obrigatórios" });

    const usuario = await Usuarios.findByPk(usuarioId); // <- usar usuarioId correto
    if (!usuario) return res.status(404).json({ msg: "Usuário não encontrado" });
    if (usuario.idade >= 16) return res.status(400).json({ msg: "Usuário tem 16 anos ou mais" });

    const vinculo = await Controle.create({ ID_usuarios: usuarioId, ID_responsaveis: idResponsavel }); // <- usar usuarioId correto

    usuario.responsavel_vinculado = true;
    await usuario.save();

    res.json({ msg: "Usuário vinculado ao responsável com sucesso", vinculo });
  } catch (err) {
    res.status(500).json({ msg: "Erro ao vincular usuário e responsável", erro: err.message });
  }
});

router.post('/add-xp', async (req, res) => {
  console.log(req.cookies)
  try {
    const userId = req.cookies.usuarioId; // ou de onde você pega o usuário logado
    const { XP_to_add } = req.body;

    if (!userId || !XP_to_add) return res.status(400).json({ error: 'Dados inválidos' });

    // Buscar usuário
    const user = await Usuarios.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    // Atualizar XP
    user.XP_user += Number(XP_to_add);
    await user.save();

    // Retornar XP atualizado
    res.json({ XP_user: user.XP_user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

router.get('/api/usuario/me', checkAuthentication, async (req, res) => {
  try{
    if (req.usuario) {
      const { ID_usuarios, name_user, XP_user } = req.usuario;
      return res.json({
        id: ID_usuarios,
        nome: name_user,
        xp: XP_user,
        idade: idade          
      });
    }
    res.status(401).json({ error: 'Não autenticado' });
  } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
});

// Ativar/Desativar controle dos pais
router.post("/api/controle/limitar", async (req, res) => {
  try {
    const { idUsuario, idResponsavel, limitado, tempoTela } = req.body;
    const controle = await Controle.findOne({ where: { ID_usuarios: idUsuario, ID_responsaveis: idResponsavel } });
    if (!controle) return res.status(404).json({ msg: "Controle não encontrado" });

    controle.limitado = limitado;
    controle.tempoTela = tempoTela || 0; // em minutos
    await controle.save();

    res.json({ msg: "Controle atualizado", controle });
  } catch (err) {
    res.status(500).json({ msg: "Erro ao atualizar controle", erro: err.message });
  }
});

router.post("/api/controle/atualizar", async (req, res) => {
  try {
    const { idUsuario, tempoGasto } = req.body; // tempoGasto em minutos
    const controle = await Controle.findOne({ where: { ID_usuarios: idUsuario } });
    if (!controle) return res.status(404).json({ msg: "Controle não encontrado" });

    controle.tempoTela += tempoGasto;

    // Atualiza limite
    const [h, m, s] = controle.horaLimite.split(':').map(Number);
    const limiteMinutos = h*60 + m + s/60;
    if (controle.tempoTela >= limiteMinutos) controle.limitado = true;

    await controle.save();

    res.json({ tempoTela: controle.tempoTela, limitado: controle.limitado });
  } catch (err) {
    res.status(500).json({ msg: "Erro ao atualizar tempo de tela", erro: err.message });
  }
});

// Verificar se usuário está bloqueado
router.get("/api/controle/status/:idUsuario", async (req, res) => {
  try {
    const controle = await Controle.findOne({ where: { ID_usuarios: req.params.idUsuario } });
    if (!controle) return res.json({ limitado: false, restante: 0 });

    // Converte horaLimite TIME (hh:mm:ss) em minutos
    const [h, m, s] = controle.horaLimite.split(':').map(Number);
    const limiteMinutos = h*60 + m + s/60;

    const restante = Math.max(0, limiteMinutos - controle.tempoTela);

    res.json({
      limitado: controle.limitado || restante <= 0,
      tempoTela: controle.tempoTela,
      restante
    });
  } catch (err) {
    res.status(500).json({ msg: "Erro ao checar status", erro: err.message });
  }
});


// Desbloquear por senha do responsável (30 min)
router.post("/api/controle/desbloquear", async (req, res) => {
  try {
    const { idUsuario, senhaResponsavel } = req.body;
    // Busca o controle + responsável
    const controle = await Controle.findOne({ where: { ID_usuarios: idUsuario } });
    if (!controle) return res.status(404).json({ msg: "Controle não encontrado" });

    const responsavel = await Responsaveis.findByPk(controle.ID_responsaveis);
    if (!responsavel || responsavel.password_resp !== senhaResponsavel) {
      return res.status(401).json({ msg: "Senha incorreta" });
    }

    // Libera temporariamente
    controle.limitado = false;
    await controle.save();

    // Seta um timer para reativar depois de 30 min (se quiser server-side)
    setTimeout(async () => {
      controle.limitado = true;
      await controle.save();
    }, 30 * 60 * 1000);

    res.json({ msg: "Usuário liberado por 30 minutos" });
  } catch (err) {
    res.status(500).json({ msg: "Erro ao desbloquear", erro: err.message });
  }
});

// ---------- LOGOUT ----------
router.post('/logout', (req, res) => {
  res.clearCookie('usuarioId');
  res.clearCookie('responsavelId');
  res.json({ msg: 'Logout realizado com sucesso' });
});

export default router;