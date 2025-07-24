const Product = require('../models/Product');
const { productEvents, PRODUCT_UPDATED } = require('../events/productEvents');

class ProductController {

    async factory(data) {
        try {
            const newProduct = await Product.create({
                name: data.name,
                price: data.price,
                description: data.description || "",
                isActive: data.isActive || true,
                isSalable: data.isSalable,
                subProducts: data.subProducts, // array com { subProduct, quantity }
                category: data.category,
                compDescription: data.compDescription,
                img: data.img
            });

            console.log('Produto criado com sucesso:', newProduct.name);
            return newProduct;
        } catch (error) {
            console.error('Erro ao criar o produto:', error);
            throw error;
        }
    } 

    async getsalableProducts(){
        return Product.find({isActive: true, isSalable : true});
    }

    async getById(_id){
        return await Product.findOne({_id});
    }

    async getSubProducts(_id){
        const product = await Product.findOne({_id}).populate({
            path: 'subProducts.subProduct',
            model: 'SubProduct'
        })

        return product.subProducts.map( sp => {
            return {
                _id: sp.subProduct._id,
                name: sp.subProduct.name,
                price: sp.subProduct.price,
                quantity: sp.quantity
            }
        });
    }


    async addSubProduct(productId, subProduct){
        const product = await Product.findOne({ _id: productId });
        if(product){
            product.addSubProduct(subProduct);
            await product.save();
            return product;
        }
        throw new Error("Produto não encontrado");
    }

    async detail(productid){
        const product = await Product.findOne({ _id : productid });
        const detail = await product.detail();
        return { "@detail":  detail };
    }

    async updatePrice(productid, newPrice) {
        const product = await Product.findOne({ _id: productid });
        if (!product) {
            throw new Error("Subproduto não encontrado");
        }

        if (product.price !== newPrice) {
            const updated = Product.findOneAndUpdate(
                { _id: productid },
                { price: newPrice },
                { new: true }
            );

            productEvents.emit(PRODUCT_UPDATED, {
                productId: productid,
                newPrice,
                oldPrice: product.price
            });

            updated.save();
            return updated;
        }
        return product;
    }
}

module.exports = new ProductController();
