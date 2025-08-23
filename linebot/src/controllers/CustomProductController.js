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

        await custom.updatePrice(subProduct.bundlePrice);

        return custom;
    }

    async removeSubProduct(subProductId, customProductid){
        let result = await CustomProduct.findOneAndUpdate(
            {
                _id: customProductid,
                'subProducts.subProductId': subProductId,
                'subProducts.quantity': { $gt: 1 }

            },
            { $inc: {
                'subProducts.$.quantity': -1,
            } },
            { new: true }
        ).populate({
            path: 'subProducts.subProductId',
            model: 'SubProduct'
        })

        if (!result){
            result = await CustomProduct.findOneAndUpdate(
                {_id: customProductid},
                {$pull: {subProducts: { subProductId } } },
                {new: true}
            );
        }

        const sp = await SubProduct.findOne({_id: subProductId});
        await result.updatePrice(-1 * sp.bundlePrice);
        return result;
    }

    async getSubproducts(_id){
        const custom = await CustomProduct.findOne({_id})
        .populate({
            path: 'subProducts.subProductId',
            model: 'SubProduct'
        });
        if(custom.subProducts.length === 0){
            return {problem: true, error: "No subproducts found for this custom product."};
        }
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

        console.log(removables);
        
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
        if (await CustomProduct.exists({_id: product})){
            return null;
        }
        return await CustomProduct.factory(product);
    }

    async detail(productid){
        const custom = await CustomProduct.findOne({ _id : productid });
        const detail = await custom.detail();
        return { "@detail":  detail };
    }

}

module.exports = new CustomProductController();
