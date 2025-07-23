const { findOne } = require('../models/Client');
const CustomProduct = require('../models/CustomProduct');

class CustomProductController {    

    addSubProduct(subProduct, customProductid){
        const custom = CustomProduct.findOne({_id : customProductid});
        custom.addSubProduct(subProduct);
    }

    removeFromCustomProduct(subProductKey, customProductid){
        const custom = CustomProduct.findOne(customProductid);
        custom.removeSubProduct(subProductKey);
    }

    async getSubproducts(_id){
        const custom = await CustomProduct.findOne({_id})
        .populate({
            path: 'subProducts.subProductId',
            model: 'SubProduct'
        });
        return custom.subProducts;
    }

    async create(product){
        return await CustomProduct.factory(product);
    }

    async detail(productid){
        const product = await CustomProduct.findOne({ _id : productid });
        return { "@detail: ": await product.detail() };
    }

}

module.exports = new CustomProductController();
