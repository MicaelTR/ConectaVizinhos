// ==========================
// Conecta Vizinhos - API simples (sem banco de dados)
// ==========================
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ==========================
// Dados em memória (somem ao reiniciar o servidor)
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
        fecha: "20:00"
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
        fecha: "22:00"
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
        fecha: "23:00"
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
        fecha: "11:00"
    }
];


// ==========================
// Rotas da API
// ==========================

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
// Inicializa servidor
// ==========================
app.listen(PORT, () => {
    console.log(`🚀 API rodando em http://localhost:${PORT}`);
});
