const SubProduct = require('../models/SubProduct');

class SubProductController {

    async getById(_id){
        return SubProduct.findOne({ _id }) ?? new Error('Produto filho não encontrado.');
    }

    async getAllFromParentProduct(parentProductId){
        return await SubProduct.find({ parentProduct : parentProductId})
    }

    async getExchangeables(_id){
        const subProduct = await SubProduct.findOne({_id});

        const exchangeables = await SubProduct.find(
            {
                parentProduct: subProduct.parentProduct,
                category: subProduct.category,
                _id: { $ne: subProduct._id }
            }
        )
        return exchangeables.map(sp =>{
            return {
                _id: sp._id,
                name: sp.name,
                price: sp.bundlePrice,
                quantity: sp.quantity
            }
        });
    }

    async factory(product, data){

        return await SubProduct.create({
            name : product.name,
            product: product._id,
            category: product.category,
            parentProduct: data.parentProduct,
            bundlePrice: data.bundlePrice,
            quantity: data.quantity || 1,
            isEssential: data.isEssential || false
        })
    }

}

module.exports = new SubProductController();