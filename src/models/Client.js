const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true,
        unique: true
    },
    contactInfo: {
        name: String,
        phoneNumber: String,
    },
    orcamentos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Orcamento',
    }],
    currentSession: {
        type: String,
        unique: true,
        sparse: true, // Isso resolve!
        default: null
    }
}, { timestamps: true });


ClientSchema.statics.createClient = async function(contactInfo){
    return await this.create({
        number : contactInfo.number,
        contactInfo : {
            name : contactInfo.name,
            phoneNumber : contactInfo.number.split("@")[0]
        }
    });
}

ClientSchema.methods.lastOrcamento = async function() {
  const clienteComOrcamentos = await this.populate({
    path: 'orcamentos',
    options: { 
      sort: { createdAt: -1 },
      limit: 1
    }
  });
  return clienteComOrcamentos.orcamentos[0] || null;

};

ClientSchema.methods.lastOrcamentoId = async function() {
  // Usando aggregation diretamente no modelo
  const result = await this.model('Client').aggregate([
    { $match: { _id: this._id } },
    { $project: {
      ultimoOrcamento: { $arrayElemAt: ["$orcamentos", -1] }
    }}
  ]);
  
  return result[0]?.ultimoOrcamento || null;

};

ClientSchema.methods.getName = function () {
    return this.contactInfo?.name || null;
};

// Setter: atualiza o nome
ClientSchema.methods.setName = function (newName) {
    if (typeof newName === 'string') {
        this.contactInfo.name = newName.trim();
    }
};

// Getter: retorna o telefone
ClientSchema.methods.getPhoneNumber = function () {
    return this.contactInfo?.phoneNumber || null;
};

// Setter: atualiza o telefone
ClientSchema.methods.setPhoneNumber = function (newNumber) {
    if (typeof newNumber === 'string') {
        this.contactInfo.phoneNumber = newNumber.trim();
    }
};

// Sessão atual
ClientSchema.methods.setCurrentSession = function (sessionId) {
    this.currentSession = sessionId;
};

ClientSchema.methods.getCurrentSession = function () {
    return this.currentSession;
}

ClientSchema.methods.clearCurrentSession = function () {
    this.currentSession = null;
};

ClientSchema.methods.hasActiveSession = function () {
    return !!this.currentSession;
};

//orcamento
ClientSchema.methods.addOrcamento = function (orcamentoId) {
    this.orcamentos.push(orcamentoId)
};

module.exports = mongoose.model('Client', ClientSchema);