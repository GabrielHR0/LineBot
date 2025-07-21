const mongoose = require('mongoose');

const SubProductSchema = mongoose.Schema({
    
    name: {
        type: String,
        trim: true
    },
    parentProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    bundlePrice: {
        type: Number,
        min: 0
    },
    quantity: {
        type: Number,
        default: 1
    },
    isEssential: {
        type: Boolean,
    }
})

SubProductSchema.methods.reduce = function (quantity) {
  this.quantity -= quantity;
};

SubProductSchema.methods.add = function (quantity) {
  this.quantity += quantity;
};

module.exports = mongoose.model('SubProduct', SubProductSchema);
