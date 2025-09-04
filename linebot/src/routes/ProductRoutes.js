const express = require('express');
const router = express.Router();

const Product = require('../controllers/ProductController')
const SubProduct = require('../controllers/SubProductController')

router.post('/new', async (req, res) => {
    const { data } = req.body;
    console.log("Data: ", data);
    const product = Product.factory(data);
    res.status(201).json(product);
})

router.post('/addSp', async (req, res) => {
    const {productId, subProduct} = req.body;
    if(subProduct._id){
        Product.addSubProduct(productId, subProduct);
        return res.status(200).json("Produto filho adicionado");
    }
    const sp = SubProduct.getById(subProduct);
    Product.addSubProduct(productId, sp);
})

router.post('SubProduct/new', async (req, res) =>{
    const { data } = req.body;
    console.log("Data: ", data);
    const sp = SubProduct.create(data);
    res.status(201).json("SubProduct criado: ", sp);
})

router.get('/allSalableActive', async (req, res) => {
    const products = await Product.getsalableProducts();
    res.status(200).json(products);
});

router.get('/all', async (req, res) => {
    const products = await Product.getAll();
    res.status(200).json(products);
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const product = await Product.getById(id);
    if (!product) {
        return res.status(404).json("Produto não encontrado");
    }
    res.status(200).json(product);
});



module.exports = router;

