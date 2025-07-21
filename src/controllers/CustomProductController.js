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

    create(subProductKey, customProductid){
        const custom = CustomProduct.findOne(customProductid);
        custom.createCustomProduct(subProductKey);
    }

    async detail(productid){
        const product = await CustomProduct.findOne({ _id : productid });
        return { "@detail: ": await product.detail() };
    }

}

module.exports = new CustomProductController();
