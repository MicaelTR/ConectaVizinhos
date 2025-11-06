const mongoose = require('mongoose');

const LojaSchema = new mongoose.Schema({
  dono: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  nome: { type: String, required: true },
  categoria: { type: String, required: true },
  descricao: String,
  endereco: String,
  telefone: String,
  imagem: String,
  criadoEm: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Loja', LojaSchema);
