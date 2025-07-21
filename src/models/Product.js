const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: '',
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  },
  isSalable: {
    type: Boolean,
    required: true,
    default: true
  },
  subProducts: [{
    subProduct : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubProduct',
        default: []
    },
    quantity : {
        type: Number,
        default: 1
    }
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  compDescription: {
    type: String,
    default: '',
    trim: true
  },
  img: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Indexes
ProductSchema.index({ isActive: 1, isSalable: 1 });
ProductSchema.index({ category: 1 });

ProductSchema.virtual('hasSubproducts').get(function() {
    return this.subProducts && this.subProducts.length > 0;
})

ProductSchema.methods.addSubProduct = function(subProduct){

    if (subProduct?._id){
        subProduct.setParentProduct(this._id);
        this.subProducts.push({
            subProduct: subProduct._id,
            quantity: subProduct.quantity || 1
        })
    }
}

ProductSchema.methods.removeSubProduct = function(subProductId) {
    
    this.subProducts = this.subProducts.filter(sp => !sp.subProduct.equals(subProductId));
    
}

ProductSchema.methods.calculatePrice = async function() {
    if (this.hasSubproducts) {
        const populatedProduct = await this.populate('subProducts.subProduct')

        return populatedProduct.subProducts.reduce((total, sp) => {
            const price = sp.subProduct?.bundlePrice || 0;
            const quantity = sp.quantity || 1;
            return total + (price * quantity);
        }, 0);
    }

    return this.price;
}

ProductSchema.methods.detail = async function (params) {
    let msg = `Produto: ${this.name}\n`;
    msg += `Preço: R$ ${this.price.toFixed(2)}\n`;

    if (this.description) {
        msg += `Descrição: ${this.description}\n`;
    }

    if (this.compDescription) {
        msg += `Detalhes: ${this.compDescription}\n`;
    }

    if (this.hasSubproducts) {
        const populatedSp = await this.populate('subProducts.subProduct');

        msg += `\nItens inclusos:\n`;
        populatedSp.subProducts.forEach(sp => {
        const qnt = sp.quantity ?? 1;
        msg += ` - ${qnt}x ${sp.subProduct?.name || '[Subproduto inválido]'} \n`;
        });
    }

    return msg.trim();
}

module.exports = mongoose.model('Product', ProductSchema);
