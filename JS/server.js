require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const path = require('path');

const Usuario = require('./models/Usuario');
const Loja = require('./models/Loja');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================
// Middlewares
// ==========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================
// Conexão MongoDB + GridFS
// ==========================
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/conecta_vizinhos';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const conn = mongoose.connection;

let gfsBucket;
conn.once('open', () => {
  gfsBucket = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'uploads' });
  console.log('✅ Conectado ao MongoDB + GridFS pronto');
});

// ==========================
// Configuração do Multer + GridFSStorage
// ==========================
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) =>
    new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) return reject(err);
        const filename = buf.toString('hex') + path.extname(file.originalname);
        resolve({ filename, bucketName: 'uploads' });
      });
    }),
});

const upload = multer({ storage });

// ==========================
// JWT Middleware
// ==========================
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token ausente' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
    req.user = user;
    next();
  });
}

// ==========================
// ROTAS DE USUÁRIOS
// ==========================

// Cadastro
app.post('/usuarios/cadastro', async (req, res) => {
  try {
    let { nome, dataNascimento, email, senha } = req.body;

    if (!nome || !dataNascimento || !email || !senha)
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });

    // Corrige formato da data se vier como DD/MM/YYYY
    if (typeof dataNascimento === 'string' && dataNascimento.includes('/')) {
      const [dia, mes, ano] = dataNascimento.split('/');
      dataNascimento = `${ano}-${mes}-${dia}`;
    }

    const dataValida = new Date(dataNascimento);
    if (isNaN(dataValida.getTime()))
      return res.status(400).json({ error: 'Data de nascimento inválida' });

    const existente = await Usuario.findOne({ email });
    if (existente) return res.status(400).json({ error: 'E-mail já cadastrado' });

    const novoUsuario = new Usuario({
      nome,
      dataNascimento: dataValida,
      email,
      senha,
    });

    await novoUsuario.save();
    res.status(201).json({ message: '✅ Usuário cadastrado com sucesso!' });
  } catch (err) {
    console.error('Erro no cadastro:', err);
    res.status(500).json({ error: 'Erro interno ao cadastrar usuário' });
  }
});

// Login
app.post('/usuarios/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha)
      return res.status(400).json({ error: 'Preencha email e senha' });

    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

    const senhaCorreta = await usuario.compararSenha(senha);
    if (!senhaCorreta)
      return res.status(401).json({ error: 'Senha incorreta' });

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
      },
      token,
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno ao realizar login' });
  }
});

// Minha conta
app.get('/usuarios/minha-conta', autenticarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id).select('-senha');
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

    // Garante que o campo fotoPerfil venha com URL completa
    let fotoPerfilUrl = null;
    if (usuario.fotoPerfil) {
      if (usuario.fotoPerfil.startsWith('http')) {
        fotoPerfilUrl = usuario.fotoPerfil;
      } else {
        fotoPerfilUrl = `${req.protocol}://${req.get('host')}${usuario.fotoPerfil}`;
      }
    }

    res.json({
      ...usuario.toObject(),
      fotoPerfil: fotoPerfilUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar conta' });
  }
});

// Upload de foto de perfil
app.post('/usuarios/upload-foto', autenticarToken, upload.single('foto'), async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

    if (!req.file)
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    // --- Deletar foto antiga, se houver ---
    if (usuario.fotoPerfil) {
      try {
        const oldFileId = new mongoose.Types.ObjectId(usuario.fotoPerfil.split('/').pop());
        gfsBucket.delete(oldFileId, (err) => {
          if (err) console.error('Erro ao deletar foto antiga:', err);
        });
      } catch (err) {
        console.error('Erro ao processar foto antiga:', err);
      }
    }

    // Salva referência no usuário (rota relativa)
    usuario.fotoPerfil = `/usuarios/foto/${req.file.id}`;
    await usuario.save();

    // Retorna a URL completa (usável pelo frontend imediatamente)
    const fullUrl = `${req.protocol}://${req.get('host')}/usuarios/foto/${req.file.id}`;
    res.json({ message: 'Foto de perfil atualizada', fotoPerfil: fullUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar foto' });
  }
});

// Rota para servir imagem do GridFS (usuário)
app.get('/usuarios/foto/:id', async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);

    const filesColl = conn.db.collection('uploads.files');
    const fileDoc = await filesColl.findOne({ _id: fileId });

    if (!fileDoc) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const contentType = fileDoc.contentType || 'application/octet-stream';
    res.set('Content-Type', contentType);

    const downloadStream = gfsBucket.openDownloadStream(fileId);
    downloadStream.on('error', (err) => {
      console.error('Erro ao baixar imagem:', err);
      if (!res.headersSent) res.status(404).json({ error: 'Arquivo não encontrado' });
      else res.end();
    });

    downloadStream.pipe(res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: 'Erro ao buscar imagem' });
    else res.end();
  }
});

// ==========================
// ROTAS DE LOJAS (mantidas iguais)
// ==========================

// Cadastrar loja
app.post(
  '/lojas/cadastrar',
  autenticarToken,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { nome, categoria, descricao, endereco, telefone } = req.body;
      if (!nome || !categoria)
        return res.status(400).json({ error: 'Nome e categoria são obrigatórios' });

      const logoFile = req.files['logo'] ? req.files['logo'][0] : null;
      const bannerFile = req.files['banner'] ? req.files['banner'][0] : null;

      const novaLoja = new Loja({
        dono: req.user.id,
        nome,
        categoria,
        descricao,
        endereco,
        telefone,
        logoId: logoFile ? logoFile.id : null,
        bannerId: bannerFile ? bannerFile.id : null,
      });

      await novaLoja.save();
      res.status(201).json({ message: '✅ Loja cadastrada com sucesso!', loja: novaLoja });
    } catch (err) {
      console.error('Erro ao cadastrar loja:', err);
      res.status(500).json({ error: 'Erro ao cadastrar loja' });
    }
  }
);

// Minhas lojas
app.get('/lojas/minhas', autenticarToken, async (req, res) => {
  try {
    const lojas = await Loja.find({ dono: req.user.id });
    res.json(lojas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar lojas do usuário' });
  }
});

// Listar todas as lojas (públicas)
app.get('/lojas', async (req, res) => {
  try {
    const { categoria, nome } = req.query;
    const filtro = {};
    if (categoria) filtro.categoria = new RegExp(categoria, 'i');
    if (nome) filtro.nome = new RegExp(nome, 'i');

    const lojas = await Loja.find(filtro).populate('dono', 'nome email');
    res.json(lojas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar lojas' });
  }
});

// Buscar loja por ID
app.get('/lojas/:id', async (req, res) => {
  try {
    const loja = await Loja.findById(req.params.id).populate('dono', 'nome email');
    if (!loja) return res.status(404).json({ error: 'Loja não encontrada' });
    res.json(loja);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar loja' });
  }
});

// Servir imagem da loja (logo/banner)
app.get('/lojas/imagem/:id', async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);

    const filesColl = conn.db.collection('uploads.files');
    const fileDoc = await filesColl.findOne({ _id: fileId });

    if (!fileDoc) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    const contentType = fileDoc.contentType || 'application/octet-stream';
    res.set('Content-Type', contentType);

    const downloadStream = gfsBucket.openDownloadStream(fileId);
    downloadStream.on('error', (err) => {
      console.error('Erro ao baixar imagem:', err);
      if (!res.headersSent) res.status(404).json({ error: 'Arquivo não encontrado' });
      else res.end();
    });

    downloadStream.pipe(res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: 'Erro ao buscar imagem' });
    else res.end();
  }
});

// ==========================
// Inicializa servidor
// ==========================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
