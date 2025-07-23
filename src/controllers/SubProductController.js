const SubProduct = require('../models/SubProduct');

class SubProductController {

    async getById(_id){
        return SubProduct.findOne({ _id }) ?? new Error('Produto filho não encontrado.');
    }

    async getAllFromParentProduct(parentProductId){
        return await SubProduct.find({ parentProduct : parentProductId})
    }

    async getExchangeables(subProductId){
        const foundSub = await SubProduct.findOne(subProductId);

        if (!foundSub) {
            throw new Error("Nenhum subproduto encontrado");
        }

        const exchangeables = await SubProduct.find(
            {
                parentProduct: foundSub.parentProduct,
                category: foundSub.category,
                _id: !foundSub._id
            }
        )
        return exchangeables;
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