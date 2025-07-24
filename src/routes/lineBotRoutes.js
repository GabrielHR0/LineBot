const express = require('express');
const router = express.Router();

const Client = require('../controllers/ClientController');
const CustomProduct = require('../controllers/CustomProductController');
const Orcamento = require('../controllers/OrcamentoController');
const Product = require('../controllers/ProductController');
const SubProduct = require('../controllers/SubProductController');
const Suport = require('../controllers/SuportController');
const lineBot = require('../controllers/LineBotController');
const SuportController = require('../controllers/SuportController');
const LineBotController = require('../controllers/LineBotController');



// ---------------- ROTA: Início de suporte ----------------
router.put('/initSuport', async (req, res) => {
    const { contact } = req.body;
    console.log("Contato iniciado com: ", contact);
    const suport = await Suport.initSuport(contact);
    res.status(201).json(suport);
});

// ---------------- ROTA: Fim de suporte ----------------
router.put('/exitSuport', async (req, res) => {
    const { contact } = req.body;
    const result = await Suport.closeSuport(contact.number);
    console.log(`Relatório do suporte encerrado: ${result}`);
    res.status(200).json(result);
});

// ---------------- ROTA: Retorna todos os produtos ----------------
// alterar para /'salableProducts'
router.put('/allProducts', async (req, res) => {
    try{
        const products = await Product.getsalableProducts();
        const produtosFormatados = await lineBot.sendProductsWithoutQuantity(products);
        res.status(200).json(produtosFormatados);
    } catch (error){
        console.error("[/allProducts] Erro ao selecionar produto:", error);
        res.status(500).send({ error: 'Erro interno ao selecionar produto.' });
    }
});

// ---------------- ROTA: Seleciona um produto ----------------
router.put('/selectProduct', async (req, res) => {
    const { id, contact } = req.body;
    try {
        const product = await Product.getById(id);
        await Suport.setCurrentProduct(contact.number, product);
        res.status(200).json(product);
    } catch (error) {
        console.error("[/selectProduct] Erro ao selecionar produto:", error);
        res.status(500).send({ error: 'Erro interno ao selecionar produto.' });
    }
});

// ---------------- ROTA: Adiciona ao orçamento ----------------
router.put('/addToOrcamento', async (req, res) => {
    const { contact } = req.body;
    const suport = await Suport.getSuportByContact(contact.number);
    try{
        if(!suport.currentOrcamento){
            const orcamento = await Orcamento.create(suport.client);
            console.log("Orcamento encontrado:", orcamento);
            await suport.setCurrentOrcamento(orcamento._id);
            await orcamento.addItem(suport.currentProduct.product, suport.currentProduct.productType);
            await Orcamento.updatePrice(orcamento);
            return res.status(200).json(orcamento);
        }
        const item = await Product.getById(suport.currentProduct.product);
        const orcamento = await Orcamento.addItem(suport.currentOrcamento, item);
        res.status(200).json(orcamento);
    } catch (error) {
        console.error("[/addToOrcamento] Erro ao adicionar produto no novo orçamento:", error);
        res.status(500).send({ error: 'Erro interno ao adicionar produto no orçamento.' });
    }
});

// ---------------- ROTA: Remove do orçamento ----------------
router.put('/removeFromOrcamento', async (req, res) => {
    const { id, contact } = req.body;
    try{
        const suport = await Suport.getSuportByContact(contact.number);
        const item = await Product.getById(suport.currentProduct.product);
        const orcamento = await Orcamento.removeItem(suport.currentOrcamento, item);
        res.send(orcamento);
    } catch (error) {
        console.error("[/addToOrcamento] Erro ao remover produto no novo orçamento:", error);
        res.status(500).send({ error: 'Erro interno ao remover produto no orçamento.' });
    }
});

// ---------------- ROTA: retorna os produtos do orçamento ----------------
router.put('/getProductsFromOrcamento', async (req, res) => {
    const { contact } = req.body;
    const suport = await Suport.getSuportByContact(contact.number);
    const products = await Orcamento.getItems(suport.currentOrcamento);
    const formatedProducts = await lineBot.sendProductsWithQuantity(products);
    res.send(formatedProducts);
});

// ---------------- ROTA: Mostra resumo do orçamento ----------------
router.put('/resumoOrcamento', async (req, res) => {
    const { contact } = req.body;
    const suport = await Suport.getSuportByContact(contact.number);
    const resume = await Orcamento.resume(suport.currentOrcamento);
    console.log("Orçamento: ", resume);
    res.send(resume);
});

// ---------------- ROTA: Fim de suporte ----------------
router.put('/saveOrcamento', async (req, res) => {
    const { contact } = req.body;
    const suport = await Suport.getSuportByContact(contact.number);
    const client = await Client.pushOrcamento(suport.client, suport.currentOrcamento);
    res.status(200).json(client);
});

// ---------------- ROTA: Define o ultimo orçamento como o atual ----------------
router.put('/editLastOrcamento', async (req, res) => {
    const { contact } = req.body;
    const client = await Client.findByNumber(contact.number);
    const orcamento = await client.lastOrcamento();
    const newOrcamento = await Orcamento.createCopy(orcamento);
    Suport.setCurrentOrcamento(client.currentSession, newOrcamento._id);
    res.status(200).json(newOrcamento);
})

// ---------------- ROTA: Mostra resumo do ultimo orçamento ----------------
router.put('/ultimoOrcamento', async (req, res) => {
    const { id, contact } = req.body;
    try{
        const result  = await Client.getLastOrcamento(contact.number);
        if (!result.orcamento){
            res.status(200).json({"@resumo": "", "@notification" : result.notification});
        }
        const resume = await Orcamento.resume(result.orcamento, result.notification);
        res.status(200).json(resume);
    } catch (error) {
        console.error("[/ultimoOrcamento] Erro ao buscar ultimo orçamento:", error);
        res.status(500).send({ error: 'Erro interno ao buscar ultimo orçamento.' });
    }
});

// ---------------- ROTA: Inicializa customização ----------------
router.put('/custom/init', async (req, res) => {
    try {
        const { contact } = req.body;
        const suport = await Suport.getSuportByContact(contact.number);
        const product = await Suport.getCurrentProduct(suport);
        const custom =  await CustomProduct.create(product);
        await suport.setCurrentProduct(custom);
        console.log("Sessão de customização iniciada:", custom);
        res.status(200).json(custom);
    } catch(error){
        console.error("[/custom/init] Erro ao criar produto customizável:", error);
        res.status(500).send({ error: 'Erro interno ao customizar produto.' });
    }
});

// ---------------- ROTA: Lista subprodutos de um produto customizado ----------------
router.put('/custom/allSubProducts', async (req, res) => {
    const { contact } = req.body;
    const suport = await Suport.getSuportByContact(contact.number);
    const product = await Suport.getCurrentProduct(suport);
    const result = await CustomProduct.getSubproducts(product._id);
    const formattedResult = await lineBot.sendProductsWithQuantity(result);
    res.status(200).json(formattedResult);
});


// ---------------- ROTA: Lista subprodutos de um produto ----------------
router.put('/getSubProducts', async (req, res) => {
    try {
        const { id, contact } = req.body;
        const subProducts = await Product.getSubProducts(id.produtoid);
        const formattedSubProducts = await lineBot.sendProductsWithQuantity(subProducts);
        res.status(200).json(formattedSubProducts);
    } catch (error){
        
    }
});

// ---------------- ROTA: Retorna produtos para remoção ----------------
router.put('/custom/getExchangeableProducts', async (req, res) => {
    const { id } = req.body;

    try {
        const exchangeable = await SubProduct.getExchangeables(id);
        const formattedExchangeable = await lineBot.sendProductsWithQuantity(exchangeable);
        res.status(200).json(formattedExchangeable);
    } catch(error) {

    }
});

// ---------------- ROTA: Retorna produtos para substituição ----------------
router.put('/custom/getRemovableProducts', async (req, res) => {
  try {
    const { contact } = req.body;

    const suport = await Suport.getSuportByContact(contact.number);
    const removables = await CustomProduct.getRemovableSubProducts(suport.currentProduct.product);
    const formattedRemovables = await lineBot.sendProductsWithoutQuantity(removables)
    res.status(200).json(formattedRemovables);
  } catch (error) {
    console.error('❌ Erro em /custom/getRemovableProducts:', error);
    res.status(500).send({ error: 'Erro ao obter produtos removíveis.' });
  }
});

// ---------------- ROTA: Adiciona subproduto customizado ----------------
router.put('/custom/addSubProduct', async (req, res) => {
    const { id, contact } = req.body;

    const suport = await Suport.getSuportByContact(contact.number);
    const subProduct = await SubProduct.getById(id);
    const result = await CustomProduct.addSubProduct(subProduct, suport.currentProduct.product);

    res.status(200).json(result);
});

// ---------------- ROTA: Remove subproduto customizado ----------------
router.put('/custom/removeSubProduct', async (req, res) => {
    const { id, contact } = req.body;

    const suport = await Suport.getSuportByContact(contact.number);
    //const subProduct = await SubProduct.getById(id);
    console.log(id);
    const result = await CustomProduct.removeSubProduct(id, suport.currentProduct.product);

    res.send(result);
});

// ---------------- ROTA: Remove subproduto customizado ----------------
router.put('/detailProduct', async (req, res) => {
    const { contact } = req.body;
    const suport = await Suport.getSuportByContact(contact.number);
    const detail = await Product.detail(suport.currentProduct.product);
    console.log("Detalhes do produto: ", detail);
    res.send(detail)
});

module.exports = router;