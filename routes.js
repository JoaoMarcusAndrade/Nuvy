import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Usuarios, Responsaveis, Controle } from "./models.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Arquivos estáticos (CSS, JS, imagens)
router.use(express.static(path.join(__dirname, 'public')));

// Rotas do SPA (todas servem o mesmo index.html)
const spaRoutes = [
  '/',
  '/login',
  '/cadastro',
  '/login/responsavel',
  '/cadastro/responsavel'
];

spaRoutes.forEach(route => {
  router.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
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

    // Lógica de menores de 13 anos
    if (usuario.idade < 13 && !usuario.responsavel_vinculado) {
      return res.status(403).json({ 
        msg: "Usuário menor de idade precisa cadastrar ou vincular um responsável.",
        requireResponsavel: true
      });
    }

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
      responsavel_vinculado: idade >= 13 // já marca true se tiver 13 ou mais
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
    if (usuario.idade >= 13) return res.status(400).json({ msg: "Usuário tem 13 anos ou mais, não precisa de responsável" });

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

router.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

export default router;