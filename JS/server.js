// ==========================
//  Conecta Vizinhos - API simples (sem banco de dados)
// ==========================
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ==========================
//  Dados em memória (somem ao reiniciar o servidor)
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
    {
      nome: "Pão Francês",
      preco: 0.80,
      descricao: "Fresco, crocante e assado na hora.",
      imagem: "https://images.unsplash.com/photo-1608198093002-ad4e0054842b"
    },
    {
      nome: "Bolo de Fubá",
      preco: 12.00,
      descricao: "Tradicional, fofinho e com gostinho de infância.",
      imagem: "https://images.unsplash.com/photo-1601972599720-b7a5e7c0e5b8"
    },
    {
      nome: "Sonho",
      preco: 6.50,
      descricao: "Recheado com creme e polvilhado com açúcar.",
      imagem: "https://images.unsplash.com/photo-1589387873277-5f9b3a5f9a32"
    }
  ],
  2: [
    {
      nome: "Arroz 5kg",
      preco: 25.90,
      descricao: "Arroz branco tipo 1, pacote de 5kg.",
      imagem: "https://images.unsplash.com/photo-1586201375754-257d0bca5c1e"
    },
    {
      nome: "Feijão Carioca 1kg",
      preco: 8.50,
      descricao: "Feijão tipo 1, grãos selecionados.",
      imagem: "https://images.unsplash.com/photo-1601050690597-9b02a6ac32c7"
    },
    {
      nome: "Leite Integral 1L",
      preco: 6.90,
      descricao: "Leite integral de qualidade.",
      imagem: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b"
    }
  ],
  3: [
    {
      nome: "Dipirona 500mg",
      preco: 10.00,
      descricao: "Analgésico e antitérmico.",
      imagem: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b"
    },
    {
      nome: "Vitamina C 1g",
      preco: 15.00,
      descricao: "Fortalece o sistema imunológico.",
      imagem: "https://images.unsplash.com/photo-1606813902735-67d9e49e2e34"
    },
    {
      nome: "Paracetamol",
      preco: 8.00,
      descricao: "Analgésico e antipirético de uso comum.",
      imagem: "https://images.unsplash.com/photo-1584824486539-53bb4646bdbc"
    }
  ],
  4: [
    {
      nome: "X-Salada",
      preco: 18.00,
      descricao: "Hambúrguer artesanal com queijo e salada.",
      imagem: "https://images.unsplash.com/photo-1550547660-d9450f859349"
    },
    {
      nome: "Batata Frita",
      preco: 10.00,
      descricao: "Crocante por fora e macia por dentro.",
      imagem: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5"
    },
    {
      nome: "Coca-Cola Lata",
      preco: 6.00,
      descricao: "Bebida gelada para acompanhar o lanche.",
      imagem: "https://images.unsplash.com/photo-1565958011705-44e21199e8d4"
    }
  ]
};


// ==========================
//  Rotas da API
// ==========================a

// 🟢 Listar todas as lojas
app.get('/lojas', (req, res) => {
  const { categoria, nome } = req.query;
  let resultado = lojas;

  if (categoria) {
    resultado = resultado.filter(l => l.categoria.toLowerCase() === categoria.toLowerCase());
  }

  if (nome) {
    resultado = resultado.filter(l => l.nome.toLowerCase().includes(nome.toLowerCase()));
  }

  res.json(resultado);
});

// 🟢 Buscar loja por ID
app.get('/lojas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const loja = lojas.find(l => l.id === id);
  if (!loja) return res.status(404).json({ error: "Loja não encontrada." });
  res.json(loja);
});

// 🟢 Buscar produtos da loja
app.get('/lojas/:id/produtos', (req, res) => {
  const id = parseInt(req.params.id);
  res.json(produtos[id] || []);
});

// 🟢 Adicionar nova loja
app.post('/lojas', (req, res) => {
  const nova = req.body;
  if (!nova.nome || !nova.categoria) {
    return res.status(400).json({ error: "Nome e categoria são obrigatórios." });
  }

  nova.id = lojas.length ? lojas[lojas.length - 1].id + 1 : 1;
  lojas.push(nova);
  res.status(201).json(nova);
});

// 🟢 Atualizar loja existente
app.put('/lojas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = lojas.findIndex(l => l.id === id);
  if (index === -1) return res.status(404).json({ error: "Loja não encontrada." });

  lojas[index] = { ...lojas[index], ...req.body };
  res.json(lojas[index]);
});

// 🟢 Excluir loja
app.delete('/lojas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  lojas = lojas.filter(l => l.id !== id);
  res.json({ message: "Loja removida com sucesso." });
});

// ==========================
//  Inicializa servidor
// ==========================
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
});
