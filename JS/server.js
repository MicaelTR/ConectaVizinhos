// ==========================
//  Conecta Vizinhos - API com MongoDB + Lojas + Usuários + JWT
// ==========================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Usuario = require('./models/Usuario'); // Schema do usuário

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================
//  Middlewares
// ==========================
app.use(cors());
app.use(express.json());

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
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer token"

  if (!token) return res.status(401).json({ error: 'Acesso negado. Token ausente.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado.' });
    req.user = user; // dados do usuário decodificados
    next();
  });
}

// ==========================
//  Rotas de Usuários (Cadastro e Login)
// ==========================

// 🟢 Cadastro
app.post('/usuarios/cadastro', async (req, res) => {
  try {
    let { nome, dataNascimento, email, senha } = req.body;

    if (!nome || !dataNascimento || !email || !senha) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }

    // Suporte para datas em formato DD/MM/YYYY
    if (dataNascimento.includes('/')) {
      const [dia, mes, ano] = dataNascimento.split('/');
      dataNascimento = `${ano}-${mes}-${dia}`;
    }

    const dataValida = new Date(dataNascimento);
    if (isNaN(dataValida.getTime())) {
      return res.status(400).json({ error: 'Data de nascimento inválida.' });
    }

    if (!validarEmail(email)) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }

    if (senha.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    const existente = await Usuario.findOne({ email });
    if (existente) {
      return res.status(400).json({ error: 'E-mail já cadastrado.' });
    }

    const novoUsuario = new Usuario({
      nome,
      dataNascimento: dataValida,
      email,
      senha
    });

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

    if (!email || !senha) {
      return res.status(400).json({ error: 'Preencha e-mail e senha.' });
    }

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const senhaCorreta = await usuario.compararSenha(senha);
    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: usuario._id, nome: usuario.nome, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' } // expira em 1 dia
    );

    res.json({
      message: 'Login realizado com sucesso!',
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email
      },
      token
    });
  } catch (err) {
    console.error('❌ Erro ao realizar login:', err);
    res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
});

// 🟢 Rota protegida de exemplo
app.get('/usuarios/meu-perfil', autenticarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });

    res.json({
      nome: usuario.nome,
      email: usuario.email,
      dataNascimento: usuario.dataNascimento
    });
  } catch (err) {
    console.error('❌ Erro ao buscar perfil:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// ==========================
//  Dados de Lojas (em memória)
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
    banner: "https://images.unsplash.com/photo-1509440159596-0249088772ff",
    abre: "06:00",
    fecha: "20:00",
    motoboy: true,
    telefone: "5511999992222"
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
    banner: "https://images.unsplash.com/photo-1556761175-4b46a572b786",
    abre: "08:00",
    fecha: "22:00",
    motoboy: false,
    telefone: "5511999992222"
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
    banner: "https://images.unsplash.com/photo-1584367369853-8a1a7a7dfb3f",
    abre: "07:00",
    fecha: "23:00",
    motoboy: true,
    telefone: "5511999992222"
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
    banner: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
    abre: "10:00",
    fecha: "02:00",
    motoboy: true,
    telefone: "5511999998888"
  }
];

// ==========================
//  Produtos simulados por loja
// ==========================
const produtos = {
  1: [
    { nome: "Pão Francês", preco: 0.80, descricao: "Fresco, crocante e assado na hora.", imagem: "https://images.unsplash.com/photo-1608198093002-ad4e0054842b" },
    { nome: "Bolo de Fubá", preco: 12.00, descricao: "Tradicional, fofinho e com gostinho de infância.", imagem: "https://images.unsplash.com/photo-1601972599720-b7a5e7c0e5b8" },
    { nome: "Sonho", preco: 6.50, descricao: "Recheado com creme e polvilhado com açúcar.", imagem: "https://images.unsplash.com/photo-1589387873277-5f9b3a5f9a32" }
  ],
  2: [
    { nome: "Arroz 5kg", preco: 25.90, descricao: "Arroz branco tipo 1.", imagem: "https://images.unsplash.com/photo-1586201375754-257d0bca5c1e" },
    { nome: "Feijão Carioca 1kg", preco: 8.50, descricao: "Feijão tipo 1, grãos selecionados.", imagem: "https://images.unsplash.com/photo-1601050690597-9b02a6ac32c7" },
    { nome: "Leite Integral 1L", preco: 6.90, descricao: "Leite integral de qualidade.", imagem: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b" }
  ]
};


// Rota protegida para a página Minha Conta
app.get('/usuarios/minha-conta', autenticarToken, async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.user.id).select('-senha'); // não envia a senha
        if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });

        res.json({
            nome: usuario.nome,
            email: usuario.email,
            dataNascimento: usuario.dataNascimento,
            criadoEm: usuario.createdAt,   // data de criação da conta
            tipo: usuario.tipo || 'usuario', // se for usuário ou motoboy
            fotoPerfil: usuario.fotoPerfil || null
        });
    } catch (err) {
        console.error('Erro ao buscar conta:', err);
        res.status(500).json({ error: 'Erro interno.' });
    }
});


// ==========================
//  Rotas das Lojas
// ==========================

// Listar todas
app.get('/lojas', (req, res) => {
  const { categoria, nome } = req.query;
  let resultado = lojas;

  if (categoria) resultado = resultado.filter(l => l.categoria.toLowerCase() === categoria.toLowerCase());
  if (nome) resultado = resultado.filter(l => l.nome.toLowerCase().includes(nome.toLowerCase()));

  res.json(resultado);
});

// Buscar loja por ID
app.get('/lojas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const loja = lojas.find(l => l.id === id);
  if (!loja) return res.status(404).json({ error: "Loja não encontrada." });
  res.json(loja);
});

// Buscar produtos da loja
app.get('/lojas/:id/produtos', (req, res) => {
  const id = parseInt(req.params.id);
  res.json(produtos[id] || []);
});

// Criar nova loja
app.post('/lojas', (req, res) => {
  const nova = req.body;
  if (!nova.nome || !nova.categoria)
    return res.status(400).json({ error: "Nome e categoria são obrigatórios." });

  nova.id = lojas.length ? lojas[lojas.length - 1].id + 1 : 1;
  lojas.push(nova);
  res.status(201).json(nova);
});

// Atualizar loja
app.put('/lojas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = lojas.findIndex(l => l.id === id);
  if (index === -1) return res.status(404).json({ error: "Loja não encontrada." });

  lojas[index] = { ...lojas[index], ...req.body };
  res.json(lojas[index]);
});

// Excluir loja
app.delete('/lojas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  lojas = lojas.filter(l => l.id !== id);
  res.json({ message: "Loja removida com sucesso." });
});

// ==========================
//  Inicializa Servidor
// ==========================
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
