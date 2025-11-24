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
const Admin = require('./models/Admin'); 

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
    abre: "6:00",
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
// ===============================
// Produtos simulados por loja
// ===============================
const produtos = {
  1: [
    {
      nome: "Pão Francês",
      preco: 0.80,
      imagem: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=400&q=80"
    },
    {
      nome: "Bolo de Fubá",
      preco: 12.00,
      imagem: "https://images.unsplash.com/photo-1587854692152-93dcf38a42c2?auto=format&fit=crop&w=400&q=80"
    },
    {
      nome: "Rosquinha Caseira",
      preco: 8.50,
      imagem: "https://images.unsplash.com/photo-1607532941433-304659e819a0?auto=format&fit=crop&w=400&q=80"
    }
  ],

  2: [
    {
      nome: "Arroz Tipo 1 5kg",
      preco: 23.90,
      imagem: "https://images.unsplash.com/photo-1600180758890-6b94519a8ba9?auto=format&fit=crop&w=400&q=80"
    },
    {
      nome: "Feijão Carioca 1kg",
      preco: 7.80,
      imagem: "https://images.unsplash.com/photo-1621996346565-94e2a697b3cb?auto=format&fit=crop&w=400&q=80"
    },
    {
      nome: "Café Torrado 500g",
      preco: 14.50,
      imagem: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80"
    }
  ],

  3: [
    {
      nome: "Açaí 500ml",
      preco: 15.00,
      imagem: "https://images.unsplash.com/photo-1590080875839-87b6e84f2fba?auto=format&fit=crop&w=400&q=80"
    },
    {
      nome: "Vitamina de Banana",
      preco: 10.00,
      imagem: "https://images.unsplash.com/photo-1601050690597-80d25b65c4cf?auto=format&fit=crop&w=400&q=80"
    },
    {
      nome: "Tigela Tropical",
      preco: 18.00,
      imagem: "https://images.unsplash.com/photo-1627662056889-4e9f9c23cc05?auto=format&fit=crop&w=400&q=80"
    }
  ],
  4: [
    {
      nome: "Pastel de Carne",
      preco: 8.00,
      imagem: "https://images.unsplash.com/photo-1625944230946-bf7b2dc6d60b?auto=format&fit=crop&w=400&q=80"
    },
    {
      nome: "Pastel de Queijo",
      preco: 7.50,
      imagem: "https://images.unsplash.com/photo-1659502012513-04d8d3a5c16b?auto=format&fit=crop&w=400&q=80"
    },
    {
      nome: "Coxinha de Frango",
      preco: 6.00,
      imagem: "https://images.unsplash.com/photo-1604909053288-1961e4b03a7a?auto=format&fit=crop&w=400&q=80"
    },
    {
      nome: "Refrigerante Lata 350ml",
      preco: 5.00,
      imagem: "https://images.unsplash.com/photo-1628147428054-46d5a7c3f8ac?auto=format&fit=crop&w=400&q=80"
    },
    {
      nome: "Suco Natural de Laranja",
      preco: 7.00,
      imagem: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=400&q=80"
    },
    {
      nome: "Empada de Palmito",
      preco: 6.50,
      imagem: "https://images.unsplash.com/photo-1604909053288-1961e4b03a7a?auto=format&fit=crop&w=400&q=80"
    }
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

// ==========================
// CADASTRO DE ADMINISTRADOR
// ==========================
app.post('/admin/cadastro', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
    }

    // verifica se já existe admin com esse email
    const existente = await Admin.findOne({ email });
    if (existente) return res.status(400).json({ error: 'E-mail já cadastrado como admin' });

    const novoAdmin = new Admin({
      nome,
      email,
      senha,
      tipo: "admin"
    });

    await novoAdmin.save();

    res.status(201).json({ message: '✅ Administrador criado com sucesso!' });

  } catch (err) {
    console.error('Erro no cadastro de admin:', err);
    res.status(500).json({ error: 'Erro interno ao cadastrar admin' });
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

// =======================================
//  ROTA: Buscar loja por ID (DB ou lista local)
// =======================================
app.get("/lojas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🟡 ID recebido:", id);

    // 🔹 Tenta buscar no MongoDB primeiro
    let lojaDb = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      lojaDb = await Loja.findById(id).populate('dono', 'nome email');
    }

    if (lojaDb) {
      console.log("🟢 Loja encontrada no MongoDB:", lojaDb.nome);

      // Monta URLs das imagens (logo/banner)
      const logoUrl = lojaDb.logoId
        ? `${req.protocol}://${req.get('host')}/lojas/imagem/${lojaDb.logoId}`
        : "https://via.placeholder.com/100x100?text=Logo";

      const bannerUrl = lojaDb.bannerId
        ? `${req.protocol}://${req.get('host')}/lojas/imagem/${lojaDb.bannerId}`
        : "https://via.placeholder.com/800x400?text=Sem+Imagem";

      return res.json({
        id: lojaDb._id,
        nome: lojaDb.nome || "Nome não informado",
        descricao: lojaDb.descricao || "",
        categoria: lojaDb.categoria || "",
        endereco: lojaDb.endereco || "Endereço não informado",
        telefone: lojaDb.telefone || "Telefone não informado",
        horario: lojaDb.horario || "Horário não informado",
        motoboy: lojaDb.motoboy || false,
        imagem: bannerUrl,
        logo: logoUrl,
        produtos: produtos[lojaDb.id] || [],
      });
    }

    // 🔹 Se não achar no banco, procura na lista fixa
    const lojaLocal = lojas.find(l => String(l.id) === String(id));
    if (!lojaLocal) {
      console.warn("⚠️ Loja não encontrada:", id);
      return res.status(404).json({ error: "Loja não encontrada" });
    }

    console.log("🟢 Loja encontrada na lista local:", lojaLocal.nome);

    res.json({
      id: lojaLocal.id,
      nome: lojaLocal.nome,
      descricao: lojaLocal.descricao,
      categoria: lojaLocal.categoria,
      endereco: lojaLocal.endereco,
      telefone: lojaLocal.telefone || "Telefone não informado",
      horario: `${lojaLocal.abre} - ${lojaLocal.fecha}`,
      motoboy: lojaLocal.motoboy,
      imagem: lojaLocal.imagem || "https://via.placeholder.com/800x400?text=Sem+Imagem",
      logo: lojaLocal.logo || "https://via.placeholder.com/100x100?text=Logo",
      produtos: produtos[lojaLocal.id] || []
    });
  } catch (err) {
    console.error("❌ Erro ao buscar loja:", err);
    res.status(500).json({ error: "Erro ao buscar loja", detalhe: err.message });
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
  console.log(mongoURI)
});
