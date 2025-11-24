const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  dataNascimento: { type: Date, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  fotoPerfil: { type: String, default: null },
  tipo: { type: String, default: 'admin' }, // agora sim correto
}, { timestamps: true });

// Criptografar senha antes de salvar
adminSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) return next();
  this.senha = await bcrypt.hash(this.senha, 10);
  next();
});

// Comparar senha
adminSchema.methods.compararSenha = async function (senhaDigitada) {
  return await bcrypt.compare(senhaDigitada, this.senha);
};

module.exports = mongoose.model('Admin', adminSchema);