const mongoose = require('mongoose');

const OrcamentoSchema = mongoose.Schema({

    client : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Client',
        required : true
    },
    items : [{
        itemType : {
            type : String,
            enum : ['Product', 'CustomProduct'],
        },
        product : {
            type : mongoose.Schema.Types.ObjectId,
            refPath : 'itemType',
        },
        quantity : {
            type : Number,
            default : 1
        }
    }],
    total : {
        type : Number,
        default : 0,
        min : 0,
    }
}, { timestamps : true })

OrcamentoSchema.statics.createOcamento = async function(clientId){
    return await this.create({client : clientId});
}

OrcamentoSchema.methods.updatePrice = function(newPrice) {
    this.total = newPrice;
};

OrcamentoSchema.methods.getItem = function (itemId, itemType){
    return this.items.find(item => 
        item.product.equals(itemId) && item.itemType == itemType
    );
}

OrcamentoSchema.methods.addItem = async function (itemId, itemType, quantity = 1){
    const existingItem = this.getItem(itemId, itemType) ?? false;

    if(existingItem){
        existingItem.quantity += quantity;
        return existingItem;
    }

    this.items.push({
        itemType,
        product : itemId,
        quantity
    })
}

OrcamentoSchema.methods.removeItem = async function (itemId, itemType, quantity = 1){
    const existingItem = this.getItem(itemId, itemType) ?? false;
    if (!existingItem){
        throw new Error("Item não pertence ao orçamento");
    }

    existingItem.quantity -= quantity;

    if (existingItem.quantity <= 0) {
        const itemIndex = this.items.findIndex(item => 
            item.product.equals(itemId) && item.itemType === itemType
        );
        this.items.splice(itemIndex, 1);
    }

    return existingItem;
}

OrcamentoSchema.methods.resume = async function (){
    return {
        items : this.items.map(item => ({
            name : item.product.name,
            price : item.product.price,
            quantity: item.quantity,
            //description : item.product.description
        })),
        total : this.total
    };
}

module.exports = mongoose.model('Orcamento', OrcamentoSchema);