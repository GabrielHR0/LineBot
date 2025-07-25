const express = require('express');
const router = express.Router();

const Client = require('../controllers/ClientController');
const CustomProduct = require('../controllers/CustomProductController');
const Orcamento = require('../controllers/OrcamentoController');
const Product = require('../controllers/ProductController');
const SubProduct = require('../controllers/SubProductController');
const Suport = require('../controllers/SuportController');
const lineBot = require('../controllers/LineBotController');

// ---------------- ROTA: Início de suporte ----------------
router.put('/initSuport', async (req, res) => {
    console.log("[ROTA] /initSuport");
    const { contact } = req.body;
    console.log("Contato recebido:", contact);
    const suport = await Suport.initSuport(contact);
    console.log("Suporte iniciado:", suport);
    res.status(201).json(suport);
});

// ---------------- ROTA: Fim de suporte ----------------
router.put('/exitSuport', async (req, res) => {
    console.log("[ROTA] /exitSuport");
    const { contact } = req.body;
    console.log("Contato para encerramento:", contact);
    const result = await Suport.closeSuport(contact.number);
    console.log("Suporte encerrado:", result);
    res.status(200).json(result);
});

// ---------------- ROTA: Retorna todos os produtos ----------------
router.put('/allProducts', async (req, res) => {
    console.log("[ROTA] /allProducts");
    try {
        const products = await Product.getsalableProducts();
        console.log("Produtos saláveis:", products);
        const produtosFormatados = await lineBot.sendProductsWithoutQuantity(products);
        console.log("Produtos formatados:", produtosFormatados);
        res.status(200).json(produtosFormatados);
    } catch (error) {
        console.error("[/allProducts] Erro:", error);
        res.status(500).send({ error: 'Erro interno ao selecionar produto.' });
    }
});

// ---------------- ROTA: Seleciona um produto ----------------
router.put('/selectProduct', async (req, res) => {
    console.log("[ROTA] /selectProduct");
    const { id, contact } = req.body;
    console.log("Produto ID:", id, "Contato:", contact);
    try {
        const product = await Product.getById(id);
        console.log("Produto selecionado:", product);
        await Suport.setCurrentProduct(contact.number, product);
        res.status(200).json(product);
    } catch (error) {
        console.error("[/selectProduct] Erro:", error);
        res.status(500).send({ error: 'Erro interno ao selecionar produto.' });
    }
});

// ---------------- ROTA: Adiciona ao orçamento ----------------
router.put('/addToOrcamento', async (req, res) => {
    console.log("[ROTA] /addToOrcamento");
    const { contact } = req.body;
    console.log("Contato:", contact);
    const suport = await Suport.getSuportByContact(contact.number);
    try {
        if (!suport.currentOrcamento) {
            const orcamento = await Orcamento.create(suport.client);
            console.log("Novo orçamento criado:", orcamento);
            await suport.setCurrentOrcamento(orcamento._id);
            await orcamento.addItem(suport.currentProduct.product, suport.currentProduct.productType);
            await Orcamento.updatePrice(orcamento);
            return res.status(200).json(orcamento);
        }
        const item = await Product.getById(suport.currentProduct.product);
        const orcamento = await Orcamento.addItem(suport.currentOrcamento, item);
        console.log("Produto adicionado ao orçamento:", orcamento);
        res.status(200).json(orcamento);
    } catch (error) {
        console.error("[/addToOrcamento] Erro:", error);
        res.status(500).send({ error: 'Erro interno ao adicionar produto no orçamento.' });
    }
});

// ---------------- ROTA: Remove do orçamento ----------------
router.put('/removeFromOrcamento', async (req, res) => {
    console.log("[ROTA] /removeFromOrcamento");
    const { id, contact } = req.body;
    console.log("Produto ID:", id, "Contato:", contact);
    try {
        const suport = await Suport.getSuportByContact(contact.number);
        const item = await Product.getById(suport.currentProduct.product);
        const orcamento = await Orcamento.removeItem(suport.currentOrcamento, item);
        console.log("Produto removido do orçamento:", orcamento);
        res.send(orcamento);
    } catch (error) {
        console.error("[/removeFromOrcamento] Erro:", error);
        res.status(500).send({ error: 'Erro interno ao remover produto do orçamento.' });
    }
});

// ---------------- ROTA: retorna os produtos do orçamento ----------------
router.put('/getProductsFromOrcamento', async (req, res) => {
    console.log("[ROTA] /getProductsFromOrcamento");
    const { contact } = req.body;
    const suport = await Suport.getSuportByContact(contact.number);
    const products = await Orcamento.getItems(suport.currentOrcamento);
    console.log("Produtos no orçamento:", products);
    const formatedProducts = await lineBot.sendProductsWithQuantity(products);
    res.send(formatedProducts);
});

// ---------------- ROTA: Mostra resumo do orçamento ----------------
router.put('/resumoOrcamento', async (req, res) => {
    console.log("[ROTA] /resumoOrcamento");
    const { contact } = req.body;
    const suport = await Suport.getSuportByContact(contact.number);
    const resume = await Orcamento.resume(suport.currentOrcamento);
    console.log("Resumo do orçamento:", resume);
    res.send(resume);
});

// ---------------- ROTA: Salva orçamento ----------------
router.put('/saveOrcamento', async (req, res) => {
    console.log("[ROTA] /saveOrcamento");
    const { contact } = req.body;
    const suport = await Suport.getSuportByContact(contact.number);
    const client = await Client.pushOrcamento(suport.client, suport.currentOrcamento);
    console.log("Cliente após salvar orçamento:", client);
    res.status(200).json(client);
});

// ---------------- ROTA: Define o ultimo orçamento como atual ----------------
router.put('/editLastOrcamento', async (req, res) => {
    console.log("[ROTA] /editLastOrcamento");
    const { contact } = req.body;
    const client = await Client.findByNumber(contact.number);
    const orcamento = await client.lastOrcamento();
    const newOrcamento = await Orcamento.createCopy(orcamento);
    console.log("Novo orçamento a partir do último:", newOrcamento);
    Suport.setCurrentOrcamento(client.currentSession, newOrcamento._id);
    res.status(200).json(newOrcamento);
});

// ---------------- ROTA: Mostra resumo do último orçamento ----------------
router.put('/ultimoOrcamento', async (req, res) => {
    console.log("[ROTA] /ultimoOrcamento");
    const { id, contact } = req.body;
    try {
        const result = await Client.getLastOrcamento(contact.number);
        console.log("Resultado do último orçamento:", result);
        if (!result.orcamento) {
            return res.status(200).json({ "@resumo": "", "@notification": result.notification });
        }
        const resume = await Orcamento.resume(result.orcamento, result.notification);
        res.status(200).json(resume);
    } catch (error) {
        console.error("[/ultimoOrcamento] Erro:", error);
        res.status(500).send({ error: 'Erro interno ao buscar último orçamento.' });
    }
});

// ---------------- ROTA: Inicializa customização ----------------
router.put('/custom/init', async (req, res) => {
    console.log("[ROTA] /custom/init");
    try {
        const { contact } = req.body;
        const suport = await Suport.getSuportByContact(contact.number);
        const product = await Suport.getCurrentProduct(suport);
        const custom = await CustomProduct.create(product);
        await suport.setCurrentProduct(custom);
        console.log("Customização iniciada:", custom);
        res.status(200).json(custom);
    } catch (error) {
        console.error("[/custom/init] Erro:", error);
        res.status(500).send({ error: 'Erro interno ao customizar produto.' });
    }
});

// ---------------- ROTA: Lista subprodutos de um produto customizado ----------------
router.put('/custom/allSubProducts', async (req, res) => {
    console.log("[ROTA] /custom/allSubProducts");
    const { contact } = req.body;
    const suport = await Suport.getSuportByContact(contact.number);
    const product = await Suport.getCurrentProduct(suport);
    const result = await CustomProduct.getSubproducts(product._id);
    const formattedResult = await lineBot.sendProductsWithQuantity(result);
    console.log("Subprodutos customizados:", formattedResult);
    res.status(200).json(formattedResult);
});

// ---------------- ROTA: Lista subprodutos de um produto ----------------
router.put('/getSubProducts', async (req, res) => {
    console.log("[ROTA] /getSubProducts");
    try {
        const { id, contact } = req.body;
        console.log("Produto ID:", id);
        const suport = await Suport.getSuportByContact(contact.number);
        if (suport.currentProduct.productType === "CustomProduct") {
            const subProducts = await CustomProduct.getSubproducts(suport.currentProduct.product);
            console.log("SubProducts:", subProducts);
            return res.send(subProducts);
        }
        const subProducts = await Product.getSubProducts(suport.currentProduct.product);
        const formattedSubProducts = await lineBot.sendProductsWithQuantity(subProducts);
        res.status(200).json(formattedSubProducts);
    } catch (error) {
        console.error("[/getSubProducts] Erro:", error);
        res.status(500).send({ error: 'Erro ao buscar subprodutos.' });
    }
});

// ---------------- ROTA: Retorna produtos para substituição ----------------
router.put('/custom/getExchangeableProducts', async (req, res) => {
    console.log("[ROTA] /custom/getExchangeableProducts");
    const { id } = req.body;
    console.log("Subproduto ID:", id);
    const exchangeable = await SubProduct.getExchangeables(id.subProdutoid);
    const formattedExchangeable = await lineBot.sendProductsWithQuantity(exchangeable);
    res.status(200).json(formattedExchangeable);
});

// ---------------- ROTA: Retorna produtos para remoção ----------------
router.put('/custom/getRemovableProducts', async (req, res) => {
    console.log("[ROTA] /custom/getRemovableProducts");
    try {
        const { contact } = req.body;
        const suport = await Suport.getSuportByContact(contact.number);
        const removables = await CustomProduct.getRemovableSubProducts(suport.currentProduct.product);
        const formattedRemovables = await lineBot.sendProductsWithoutQuantity(removables);
        res.status(200).json(formattedRemovables);
    } catch (error) {
        console.error("[/custom/getRemovableProducts] Erro:", error);
        res.status(500).send({ error: 'Erro ao obter produtos removíveis.' });
    }
});

// ---------------- ROTA: Adiciona subproduto customizado ----------------
router.put('/custom/addSubProduct', async (req, res) => {
    console.log("[ROTA] /custom/addSubProduct");
    const { id, contact } = req.body;
    const suport = await Suport.getSuportByContact(contact.number);
    const subProduct = await SubProduct.getById(id);
    const result = await CustomProduct.addSubProduct(subProduct, suport.currentProduct.product);
    console.log("Subproduto adicionado:", result);
    res.status(200).json(result);
});

// ---------------- ROTA: Remove subproduto customizado ----------------
router.put('/custom/removeSubProduct', async (req, res) => {
    console.log("[ROTA] /custom/removeSubProduct");
    const { id, contact } = req.body;
    const suport = await Suport.getSuportByContact(contact.number);
    const result = await CustomProduct.removeSubProduct(id, suport.currentProduct.product);
    console.log("Subproduto removido:", result);
    res.send(result);
});

// ---------------- ROTA: Detalhes do produto atual ----------------
router.put('/detailProduct', async (req, res) => {
    console.log("[ROTA] /detailProduct");
    const { contact } = req.body;
    console.log("Contato:", contact);
    const suport = await Suport.getSuportByContact(contact.number);
        console.log("Current Produtct:", suport.currentProduct);
    if (suport.currentProduct.productType === "CustomProduct") {
        const detail = await CustomProduct.detail(suport.currentProduct.product);
        console.log("Detalhes do produto customizado:", detail);
        return res.send(detail);
    }
    const detail = await Product.detail(suport.currentProduct.product);
    console.log("Detalhes do produto comum:", detail);
    res.send(detail);
});

module.exports = router;
