const express = require('express');
const router = express.Router();

const SubProduct = require('../controllers/SubProductController');
const Product = require('../controllers/ProductController');

router.post('/new', async (req,res) =>{
    const {productId, data} = req.body;
    const product = await Product.getById(productId);
    const subProduct = await SubProduct.factory(product, data);
    console.log("Sub: ", subProduct);
    await Product.addSubProduct(data.parentProduct, subProduct);
    res.send(subProduct);
})

module.exports = router;

