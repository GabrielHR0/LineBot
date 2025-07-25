const { findOne } = require('../models/Client');
const CustomProduct = require('../models/CustomProduct');
const SubProduct = require('../models/SubProduct');

class CustomProductController {    

    async addSubProduct(subProduct, customProductid){
        const custom = await CustomProduct.findOneAndUpdate(
            {
                _id: customProductid,
                'subProducts.subProductId': { $ne: subProduct._id }
            },
            { $push: { subProducts: {subProductId: subProduct._id, quantity: subProduct.quantity} } },
            {new: true}
        );

        if(!custom){
            return await CustomProduct.findOneAndUpdate(
                { 
                    _id: customProductid,
                    'subProducts.subProductId': subProduct._id
                },
                { $inc: {'subProducts.$.quantity': 1} },
                {new: true}
            )
        }
        return custom;
    }

    async removeSubProduct(subProductId, customProductid){
        const result = await CustomProduct.findOneAndUpdate(
            {
                _id: customProductid,
                'subProducts.subProductId': subProductId,
                'subProducts.quantity': { $gt: 1 }

            },
            { $inc: {'subProducts.$.quantity': -1} },
            { new: true }
        );

        if (!result){
            return await CustomProduct.findOneAndUpdate(
                {_id: customProductid},
                {$pull: {subProducts: { subProductId } } },
                {new: true}
            );
        }
        
        return result;
        
    }

    async updatePrice(spPrice){
        return await CustomProduct.findOneAndUpdate(
            { _id: this._id },
            { $inc: { price: Number(spPrice) } }, 
            { new: true } 
        );
    };

    async getSubproducts(_id){
        const custom = await CustomProduct.findOne({_id})
        .populate({
            path: 'subProducts.subProductId',
            model: 'SubProduct'
        });
        return custom.subProducts.map( sp => {
            return {
                _id: sp.subProductId._id,
                name: sp.subProductId.name,
                price: sp.subProductId.price,
                quantity: sp.quantity
            }
        });
    }

     async getRemovableSubProducts(_id){
        const removables = await CustomProduct.findOne({_id}).populate({
            path: 'subProducts.subProductId',
            model: 'SubProduct',
            match: { isEssential: false },
        })
        
        return removables.subProducts.map( sp => {
            return {
                _id: sp.subProductId._id,
                name: sp.subProductId.name,
                price: sp.subProductId.price,
                quantity: sp.quantity
            }
        });
    }

    async create(product){
        return await CustomProduct.factory(product);
    }

    async detail(productid){
        const custom = await CustomProduct.findOne({ _id : productid });
        const detail = await custom.detail();
        return { "@detail":  detail };
    }

}

module.exports = new CustomProductController();
