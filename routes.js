import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Usuarios, Responsaveis, Controle } from "./models.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Arquivos estáticos (CSS, JS, imagens)
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

// Rotas do SPA (todas servem o mesmo index.html)
const spaRoutes = [
  '/',
  '/login',
  '/cadastro',
  '/login/responsavel',
  '/cadastro/responsavel',
  '/jogos'
];

spaRoutes.forEach(route => {
  router.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
});

// Rota para verificar status de autenticação
router.get("/check-auth", async (req, res) => {
  try {
    const usuarioId = req.cookies.usuarioId;
    const responsavelId = req.cookies.responsavelId;
    
    let usuario = null;
    let responsavel = null;
    
    if (usuarioId) {
      usuario = await Usuarios.findByPk(usuarioId);
    }
    
    if (responsavelId) {
      responsavel = await Responsaveis.findByPk(responsavelId);
    }
    
    if (usuario || responsavel) {
      res.json({ 
        authenticated: true, 
        usuario, 
        responsavel 
      });
    } else {
      res.json({ authenticated: false });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar autenticação' });
  }
});

// Rota protegida para jogos (apenas para usuários autenticados)
router.get("/api/jogos", checkAuthentication, (req, res) => {
  // Aqui você pode retornar dados específicos dos jogos se necessário
  res.json({ jogos: [] });
});

// ---------- LOGIN USUÁRIO ----------
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    const usuario = await Usuarios.findOne({
      where: { email_user: email },
    });

    if (!usuario) {
      return res.status(404).json({ msg: "Usuário não encontrado" });
    }

    if (usuario.password_user !== senha) {
      return res.status(401).json({ msg: "Senha incorreta" });
    }

    // Lógica de menores de 16 anos
    if (usuario.idade < 16 && !usuario.responsavel_vinculado) {
      return res.status(403).json({
        msg: "Usuário menor de idade precisa cadastrar ou vincular um responsável.",
        requireResponsavel: true
      });
    }
    
    res.cookie('usuarioId', usuario.ID_usuarios, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 dia
    });
    
    res.json({ msg: "Login bem-sucedido", usuario });
  } catch (err) {
    res.status(500).json({ msg: "Erro no login", erro: err.message });
  }
});

// ---------- LOGIN RESPONSÁVEL ----------
router.post("/login/responsavel", async (req, res) => {
  try {
    const { email, senha } = req.body;

    const responsavel = await Responsaveis.findOne({
      where: { email_resp: email },
    });

    if (!responsavel) return res.status(404).json({ msg: "Responsável não encontrado" });
    if (responsavel.password_resp !== senha) return res.status(401).json({ msg: "Senha incorreta" });

    res.cookie('responsavelId', responsavel.ID_responsaveis, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 dia
    });
    
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
      name_user: nome || undefined,
      idade: idade,
      responsavel_vinculado: idade >= 16 // já marca true se tiver 16 ou mais
    });

    // Define cookie de autenticação após cadastro
    res.cookie('usuarioId', novo.ID_usuarios, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 dia
    });
    
    res.json({ msg: "Usuário cadastrado com sucesso", usuario: novo });
  } catch (err) {
    res.status(500).json({ msg: "Erro no cadastro de usuário", erro: err.message });
  }
});

// ---------- CADASTRO RESPONSÁVEL ----------
router.post("/cadastro/responsavel", async (req, res) => {
  try {
    const { email, senha, nome } = req.body;

    const existe = await Responsaveis.findOne({ where: { email_resp: email } });
    if (existe) return res.status(400).json({ msg: "E-mail já cadastrado" });

    const novo = await Responsaveis.create({
      email_resp: email,
      password_resp: senha,
      name_resp: nome || undefined
    });

    // Define cookie de autenticação após cadastro
    res.cookie('responsavelId', novo.ID_responsaveis, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 dia
    });
    
    res.json({ msg: "Responsável cadastrado com sucesso", responsavel: novo });
  } catch (err) {
    res.status(500).json({ msg: "Erro no cadastro de responsável", erro: err.message });
  }
});

// ---------- VINCULAR USUÁRIO E RESPONSÁVEL ----------
router.post("/vincular", async (req, res) => {
  try {
    const { idUsuario, idResponsavel } = req.body;

    if (!idUsuario || !idResponsavel) {
      return res.status(400).json({ msg: "ID do usuário e do responsável são obrigatórios" });
    }

    const usuario = await Usuarios.findByPk(idUsuario);
    if (!usuario) return res.status(404).json({ msg: "Usuário não encontrado" });
    if (usuario.idade >= 16) return res.status(400).json({ msg: "Usuário tem 16 anos ou mais, não precisa de responsável" });

    // Cria vínculo na tabela Controle
    const vinculo = await Controle.create({
      ID_usuarios: idUsuario,
      ID_responsaveis: idResponsavel
    });

    // Marca que o usuário agora tem responsável vinculado
    usuario.responsavel_vinculado = true;
    await usuario.save();

    res.json({ msg: "Usuário vinculado ao responsável com sucesso", vinculo });
  } catch (err) {
    res.status(500).json({ msg: "Erro ao vincular usuário e responsável", erro: err.message });
  }
});

// ---------- LOGOUT USUÁRIO E RESPONSÁVEL----------
router.post('/logout', (req, res) => {
  res.clearCookie('usuarioId');
  res.clearCookie('responsavelId');
  res.json({ msg: 'Logout realizado com sucesso' });
});

export default router;