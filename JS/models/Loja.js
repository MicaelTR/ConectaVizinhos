const mongoose = require('mongoose');

const LojaSchema = new mongoose.Schema({
  dono: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }, // <-- ADICIONE ISTO
  nome: { type: String, required: true },
  categoria: { type: String, required: true },
  descricao: String,
  endereco: String,
  telefone: String,
  logoId: mongoose.Types.ObjectId,   // referência GridFS
  bannerId: mongoose.Types.ObjectId, // referência GridFS
  motoboy: { type: Boolean, default: false }, // ✅ ADICIONADO
  criadoEm: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Loja', LojaSchema);
