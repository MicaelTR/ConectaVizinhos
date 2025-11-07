const mongoose = require('mongoose');

const LojaSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  categoria: { type: String, required: true },
  descricao: String,
  endereco: String,
  telefone: String,
  logoId: mongoose.Types.ObjectId,   // referência GridFS
  bannerId: mongoose.Types.ObjectId, // referência GridFS
  criadoEm: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Loja', LojaSchema);
