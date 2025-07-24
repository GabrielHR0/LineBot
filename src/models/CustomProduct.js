const mongoose = require('mongoose');

const CustomProductSchema = mongoose.Schema({
    product : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Product',
        required : true
    },
    name : {
        type : String,
        required : true,
        trim : true
    },
    subProducts : [{
        subProductId : {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SubProduct',
            required: true
        },
        quantity : {
            type : Number,
            default : 1
        }
    }],
    price : {
        type : Number,
        required : true,
        min : 0
    },
    removedProducts : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'SubProduct'
    }],
    addedProducts : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'SubProduct'
    }]
}, { timestamps : true })

CustomProductSchema.statics.factory = async function (product){
    return await this.create({
        product : product._id,
        name : product.name + ' Customizado',
        subProducts : product.subProducts ? product.subProducts.map(sp => ({
            subProductId : sp.subProduct || sp._id,
            quantity : sp.quantity || 1
        })) : [],
        price : product.price
    })
}

CustomProductSchema.methods.hasSubProducts = function (){
    return Array.isArray(this.subProducts) && this.subProducts.length > 0;
}

CustomProductSchema.methods.calculatePrice = async function() {
  const populatedProduct = await this.populate('subProducts.subProductId');
  
  this.price = populatedProduct.subProducts.reduce((total, { subProductId, quantity }) => {
    return total + (subProductId.bundlePrice * quantity);
  }, 0);

};

CustomProductSchema.methods.updatePrice = async function(spPrice) {
  
    try {
    const priceToAdd = Number(spPrice);

    if (isNaN(priceToAdd)) {
      throw new Error('Valor inválido para atualização de preço');
    }
    
    this.price += priceToAdd;
    await this.save();
    return this; 
  } catch (error) {
    console.error('Erro ao atualizar preço:', error);
    throw error;
  }

};

CustomProductSchema.methods.getSubProduct = function (subProductId){
    return this.subProducts.find(sub => sub.subProductId.equals(subProductId)) ?? null;
}

CustomProductSchema.methods.addSubProduct = async function (subProduct, customQuantity = 1){

    const existing = this.getSubProduct(subProduct._id);

    if(existing){
        existing.quantity += customQuantity || subProduct.quantity;;
        this.addedProducts.push(subProduct._id);
        return;
    }

    this.subProducts.push({
        subProductId: subProduct._id,
        quantity: subProduct.quantity
    });
    
    return this;
}


CustomProductSchema.methods.getDetailedInfo = async function() {
  await this.populate('product').populate('subProducts.subProductId');

  return this.detail();
};

CustomProductSchema.methods.detail = function () {
    let msg = `Produto: ${this.name}\n`;
    msg += `Preço: R$ ${(this.price / 100).toFixed(2)}\n`;

    if (this.product?.description) {
        msg += `Descrição: ${this.product.description}\n`;
    }

    if (this.product?.compDescription) {
        msg += `Detalhes: ${this.product.compDescription}\n`;
    }

    if (this.subProducts?.length) {
        msg += `\nItens inclusos:\n`;
        this.subProducts.forEach(sp => {
            const qnt = sp.quantity ?? 1;
            const name = sp.subProductId?.name || 'Produto desconhecido';
            msg += ` - ${qnt}x ${name}\n`;
        });
    }

    return msg.trim();
}

module.exports = mongoose.model('CustomProduct', CustomProductSchema);