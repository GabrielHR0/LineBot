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
                group: subProduct.group,
                _id: { $ne: subProduct._id }
            }
        )

        if (exchangeables.length = 0 ){
            return {problem: "NoSubproducts", error: "No exchangeables products found for this custom product."};
        }
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
            group: product.group,
            parentProduct: data.parentProduct,
            bundlePrice: data.bundlePrice,
            quantity: data.quantity || 1,
            isEssential: data.isEssential || false
        })
    }

}

module.exports = new SubProductController();