const mongoose = require('mongoose');

const SuportSchema = new mongoose.Schema({
    client : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    currentProduct: {
        productType : {
            type : String,
            enum : ['Product', 'CustomProduct'],
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'productType',
            default: null
        }
    },
    currentOrcamento: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Orcamento',
    },
    status: {
        type: String,
        enum: ['waiting', 'in_progress', 'assigned', 'finished'],
    },
    startTime: {
        type: Date,
        default: null
    },
    endTime: {
        type: Date,
        default: null
    },
    sessionId: {
        type: String,
        default: null,
        unique: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    }
}, {
  timestamps: true
});

SuportSchema.index({ contact: 1, status: 1 });
SuportSchema.index({ sessionId: 1, status: 1 });

SuportSchema.statics.new = function (contactNumber, clientId) {
  const suport = new this({ 
    contact: contactNumber,
    client: clientId
  });
  suport.initSuport();
  return suport;
};

SuportSchema.methods.setCurrentProduct = async function(product){
    this.currentProduct = {
        product : product._id,
        productType: product.constructor.modelName
    }
    await this.save();

}

SuportSchema.methods.setCurrentOrcamento = async function(orcamentoId){
    this.currentOrcamento = orcamentoId;
    await this.save();
}

SuportSchema.methods.initSuport = function() {
    if (['in_progress', 'assigned'].includes(this.status)){
        return this;
    }

    this.status = 'in_progress';
    this.startTime = new Date();
    this.sessionId = this.generateSessionId();
    this.currentProduct = null;
}

SuportSchema.methods.closeSuport = function () {
    if (this.status === 'finished'){
        return;
    }

    this.status = 'finished';
    this.endTime = new Date();
    this.currentProduct = null;
    
    return {
        sessionId : this.sessionId,
        duration: this.calculateDuration(),
        finalOrcamento: this.currentOrcamento
    };
}

SuportSchema.methods.calculateDuration = function() {
    if (!this.startTime) {
        return 0;
    }
    const end = this.endTime || new Date();
    return (end - this.startTime) / 1000;
};

SuportSchema.methods.generateSessionId = function() {
    return `${this.contact}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

module.exports = mongoose.model('Suport', SuportSchema);