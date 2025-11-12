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

conn.on('error', (err) => {
  console.error('Erro na conexão com MongoDB:', err);
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

  const secret = process.env.JWT_SECRET || 'chave_temporaria';
  jwt.verify(token, secret, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
    req.user = user;
    next();
  });
}

// ==========================
// Dados de exemplo (fallback)
// ==========================
let lojas = [
  {
    id: 1,
    nome: "Padaria do João",
    categoria: "padaria",
    descricao: "Pães fresquinhos e bolos caseiros todos os dias.",
    endereco: "Rua das Flores, 120",
    lat: -23.552,
    lon: -46.634,
    imagem: "https://images.unsplash.com/photo-1587241321921-91e5b7a1a8b9",
    logo: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png",
    abre: "06:00",
    fecha: "20:00",
    motoboy: true,
    telefone: "11123456789"
  },
  {
    id: 2,
    nome: "Mercadinho da Ana",
    categoria: "mercado",
    descricao: "Tudo o que você precisa sem sair do bairro.",
    endereco: "Av. Brasil, 45",
    lat: -23.548,
    lon: -46.628,
    imagem: "https://images.unsplash.com/photo-1580910051073-dedbdfd3b9f8",
    logo: "https://cdn-icons-png.flaticon.com/512/2331/2331970.png",
    abre: "08:00",
    fecha: "22:00",
    motoboy: false,
    telefone: "5511987654321"
  },
  {
    id: 3,
    nome: "Farmácia Popular",
    categoria: "farmacia",
    descricao: "Remédios e cuidados de saúde com atendimento humanizado.",
    endereco: "Rua Central, 99",
    lat: -23.556,
    lon: -46.630,
    imagem: "https://images.unsplash.com/photo-1587854692152-93dcf38a42c2",
    logo: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png",
    abre: "07:00",
    fecha: "23:00",
    motoboy: true,
    telefone: "5511911223344"
  },
  {
    id: 4,
    nome: "Lanchonete Sabor Local",
    categoria: "lanchonete",
    descricao: "Lanches rápidos e deliciosos feitos com carinho.",
    endereco: "Praça das Árvores, 15",
    lat: -23.550,
    lon: -46.635,
    imagem: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
    logo: "https://cdn-icons-png.flaticon.com/512/857/857681.png",
    abre: "10:00",
    fecha: "02:00",
    motoboy: true,
    telefone: "5511999887766"
  }
];

// 🟢 Produtos por loja (dados fixos por enquanto)
const produtos = {
  1: [
    { nome: "Pão Francês", preco: 0.80 },
    { nome: "Bolo de Fubá", preco: 12.00 },
  ],
  2: [
    { nome: "Arroz 5kg", preco: 25.90 },
    { nome: "Feijão Carioca 1kg", preco: 8.50 },
  ],
  3: [
    { nome: "Dipirona 500mg", preco: 10.00 },
    { nome: "Vitamina C 1g", preco: 15.00 },
  ],
  4: [
    { nome: "X-Salada", preco: 18.00 },
    { nome: "Coca-Cola Lata", preco: 6.00 },
  ],
};

app.get('/lojas/:id/produtos', (req, res) => {
  const id = parseInt(req.params.id);
  res.json(produtos[id] || []);
});

// ==========================
// ROTAS DE USUÁRIOS
// ==========================

// Cadastro
app.post('/usuarios/cadastro', async (req, res) => {
  try {
    let { nome, dataNascimento, email, senha } = req.body;

    if (!nome || !dataNascimento || !email || !senha)
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });

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

    const secret = process.env.JWT_SECRET || 'chave_temporaria';
    const token = jwt.sign(
      { id: usuario._id, nome: usuario.nome, email: usuario.email },
      secret,
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

    let fotoPerfilUrl = null;
    if (usuario.fotoPerfil) {
      fotoPerfilUrl = `${req.protocol}://${req.get('host')}${usuario.fotoPerfil}`;
    }

    res.json({
      ...usuario.toObject(),
      fotoPerfil: fotoPerfilUrl,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar conta' });
  }
});

// Upload de foto de perfil (arquivo)
app.post('/usuarios/upload-foto', autenticarToken, upload.single('foto'), async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

    if (!req.file)
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    if (usuario.fotoPerfil && usuario.fotoPerfil.includes('/usuarios/foto/')) {
      try {
        const oldFileId = new mongoose.Types.ObjectId(usuario.fotoPerfil.split('/').pop());
        gfsBucket.delete(oldFileId, (err) => {
          if (err) console.error('Erro ao deletar foto antiga:', err);
        });
      } catch (err) {
        console.error('Erro ao processar foto antiga:', err);
      }
    }

    usuario.fotoPerfil = `/usuarios/foto/${req.file.id}`;
    await usuario.save();

    const fullUrl = `${req.protocol}://${req.get('host')}/usuarios/foto/${req.file.id}`;
    res.json({ message: '✅ Foto de perfil atualizada!', fotoPerfil: fullUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar foto' });
  }
});

// Servir imagem do GridFS
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
// ROTAS DE LOJAS
// ==========================
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

app.get('/lojas/minhas', autenticarToken, async (req, res) => {
  try {
    const lojas = await Loja.find({ dono: req.user.id });
    res.json(lojas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar lojas do usuário' });
  }
});

app.get('/lojas', async (req, res) => {
  try {
    const { categoria, nome } = req.query;
    const filtro = {};
    if (categoria) filtro.categoria = new RegExp(categoria, 'i');
    if (nome) filtro.nome = new RegExp(nome, 'i');

    const lojasDb = await Loja.find(filtro).populate('dono', 'nome email');

    if (!lojasDb || lojasDb.length === 0) {
      console.log('⚠️ Nenhuma loja no DB — retornando exemplos locais');
      return res.json(lojas);
    }

    res.json(lojasDb);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar lojas' });
  }
});

// ✅ Rota ajustada para suportar tanto Mongo quanto mocks
app.get('/lojas/:id', async (req, res) => {
  try {
    let loja = await Loja.findById(req.params.id).populate('dono', 'nome email');

    if (!loja) {
      loja = lojas.find(l => l.id === parseInt(req.params.id));
      if (!loja) return res.status(404).json({ error: 'Loja não encontrada' });
    }

    res.json({
      id: loja._id || loja.id,
      nome: loja.nome,
      descricao: loja.descricao,
      endereco: loja.endereco,
      abre: loja.abre || '08:00',
      fecha: loja.fecha || '18:00',
      motoboy: loja.motoboy || false,
      telefone: loja.telefone || '',
      banner: loja.banner || loja.imagem || '',
      logo: loja.logo || loja.imagem || '',
      categoria: loja.categoria || '',
      dono: loja.dono || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar loja' });
  }
});

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
