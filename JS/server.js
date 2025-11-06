// ==========================
//  Conecta Vizinhos - API com MongoDB + Lojas + Usuários + JWT
// ==========================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Usuario = require('./models/Usuario');
const Loja = require('./models/Loja'); // ✅ IMPORTAÇÃO DO MODEL LOJA

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================
//  Middlewares
// ==========================
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // servir imagens públicas

// ==========================
//  Configuração do Multer (upload de imagens)
// ==========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const nomeArquivo = `${Date.now()}-${file.originalname}`;
    cb(null, nomeArquivo);
  }
});
const upload = multer({ storage });

// ==========================
//  Conexão com MongoDB
// ==========================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch((err) => console.error('❌ Erro ao conectar ao MongoDB:', err));

// ==========================
//  Funções auxiliares
// ==========================
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Middleware para validar token JWT
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acesso negado. Token ausente.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado.' });
    req.user = user;
    next();
  });
}

// ==========================
//  ROTAS DE USUÁRIOS
// ==========================

// 🟢 Cadastro
app.post('/usuarios/cadastro', async (req, res) => {
  try {
    let { nome, dataNascimento, email, senha } = req.body;

    if (!nome || !dataNascimento || !email || !senha)
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });

    if (dataNascimento.includes('/')) {
      const [dia, mes, ano] = dataNascimento.split('/');
      dataNascimento = `${ano}-${mes}-${dia}`;
    }

    const dataValida = new Date(dataNascimento);
    if (isNaN(dataValida.getTime()))
      return res.status(400).json({ error: 'Data de nascimento inválida.' });

    if (!validarEmail(email))
      return res.status(400).json({ error: 'E-mail inválido.' });

    if (senha.length < 6)
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });

    const existente = await Usuario.findOne({ email });
    if (existente)
      return res.status(400).json({ error: 'E-mail já cadastrado.' });

    const novoUsuario = new Usuario({ nome, dataNascimento: dataValida, email, senha });
    await novoUsuario.save();

    res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
  } catch (err) {
    console.error('❌ Erro ao cadastrar usuário:', err);
    res.status(500).json({ error: 'Erro interno ao cadastrar usuário.' });
  }
});

// 🟢 Login
app.post('/usuarios/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha)
      return res.status(400).json({ error: 'Preencha e-mail e senha.' });

    const usuario = await Usuario.findOne({ email });
    if (!usuario)
      return res.status(404).json({ error: 'Usuário não encontrado.' });

    const senhaCorreta = await usuario.compararSenha(senha);
    if (!senhaCorreta)
      return res.status(401).json({ error: 'Senha incorreta.' });

    const token = jwt.sign(
      { id: usuario._id, nome: usuario.nome, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login realizado com sucesso!',
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        fotoPerfil: usuario.fotoPerfil || null
      },
      token
    });
  } catch (err) {
    console.error('❌ Erro ao realizar login:', err);
    res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
});

// 🟢 Dados da conta
app.get('/usuarios/minha-conta', autenticarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id).select('-senha');
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });

    res.json({
      nome: usuario.nome,
      email: usuario.email,
      dataNascimento: usuario.dataNascimento,
      criadoEm: usuario.createdAt,
      tipo: usuario.tipo || 'usuario',
      fotoPerfil: usuario.fotoPerfil || null
    });
  } catch (err) {
    console.error('Erro ao buscar conta:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// 🟢 Upload da foto de perfil
app.post('/usuarios/upload-foto', autenticarToken, upload.single('foto'), async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });

    if (!req.file) {
      return res.json({
        message: 'Nenhuma nova imagem enviada. Mantendo a atual.',
        fotoPerfil: usuario.fotoPerfil
      });
    }

    if (usuario.fotoPerfil) {
      const caminhoAntigo = path.join(__dirname, usuario.fotoPerfil.replace(/^\//, ''));
      if (fs.existsSync(caminhoAntigo)) fs.unlinkSync(caminhoAntigo);
    }

    usuario.fotoPerfil = `/uploads/${req.file.filename}`;
    await usuario.save();

    res.json({
      message: 'Foto de perfil atualizada com sucesso!',
      fotoPerfil: usuario.fotoPerfil
    });
  } catch (err) {
    console.error('❌ Erro ao fazer upload da foto:', err);
    res.status(500).json({ error: 'Erro interno ao salvar foto de perfil.' });
  }
});

// ==========================
//  ROTAS DE LOJAS (MongoDB)
// ==========================

// 🟢 Criar nova loja
app.post('/lojas/cadastrar', autenticarToken, async (req, res) => {
  try {
    const { nome, categoria, descricao, endereco, telefone } = req.body;

    if (!nome || !categoria)
      return res.status(400).json({ error: 'Nome e categoria são obrigatórios.' });

    const novaLoja = new Loja({
      dono: req.user.id,
      nome,
      categoria,
      descricao,
      endereco,
      telefone
    });

    await novaLoja.save();
    res.status(201).json({ message: 'Loja cadastrada com sucesso!', loja: novaLoja });
  } catch (err) {
    console.error('❌ Erro ao cadastrar loja:', err);
    res.status(500).json({ error: 'Erro interno ao cadastrar loja.' });
  }
});

// 🟢 Listar lojas do usuário logado
app.get('/lojas/minhas', autenticarToken, async (req, res) => {
  try {
    const lojas = await Loja.find({ dono: req.user.id });
    res.json(lojas);
  } catch (err) {
    console.error('❌ Erro ao listar lojas:', err);
    res.status(500).json({ error: 'Erro ao buscar lojas.' });
  }
});

// 🟢 Listar todas as lojas (público)
app.get('/lojas', async (req, res) => {
  try {
    const { categoria, nome } = req.query;
    let filtro = {};
    if (categoria) filtro.categoria = new RegExp(categoria, 'i');
    if (nome) filtro.nome = new RegExp(nome, 'i');

    const lojas = await Loja.find(filtro).populate('dono', 'nome email');
    res.json(lojas);
  } catch (err) {
    console.error('❌ Erro ao listar lojas públicas:', err);
    res.status(500).json({ error: 'Erro interno ao listar lojas.' });
  }
});

// 🟢 Buscar loja por ID
app.get('/lojas/:id', async (req, res) => {
  try {
    const loja = await Loja.findById(req.params.id).populate('dono', 'nome email');
    if (!loja) return res.status(404).json({ error: 'Loja não encontrada.' });
    res.json(loja);
  } catch (err) {
    console.error('❌ Erro ao buscar loja:', err);
    res.status(500).json({ error: 'Erro interno ao buscar loja.' });
  }
});

// ==========================
//  Inicializa Servidor
// ==========================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
