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
    console.log("[/selectProduct] Produto selecionado:", id);
    console.log("[/selectProduct] Contato recebido:", contact);

    try {
        const product = await Product.getById(id);
        console.log("[/selectProduct] Product encontrado:", product);
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
    res.send(products);
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
    res.status(200).json(result);
});

// ---------------- ROTA: Lista subprodutos de um produto ----------------
router.put('/getSubProducts', async (req, res) => {
    const { id, contact } = req.body;
    console.log("[/getSubProducts] Requisição recebida");
    console.log("Contato:", contact);
    console.log("ID do produto (se houver):", id.produtoid);

    const Product = await bot.getProductByKey(id.produtoid);
    const subProducts = Product.subProducts;

    console.log("SubProducts encontrados:\n", subProducts);

    const produtosFormatados = await bot.sendProductsWithQuantity(subProducts);
    res.send(produtosFormatados);
});

// ---------------- ROTA: Retorna produtos para remoção ----------------
router.put('/custom/getExchangeableProducts', async (req, res) => {
    const { id, contact } = req.body;
    console.log("[/custom/getExchangeableProducts] Requisição recebida");
    console.log("Id do subproduto:", id);

    const exchangeable = bot.getExchangeableSubProducts(id.subProdutoid);
    const exchangeableFormated = await bot.sendProductsWithQuantity(exchangeable);
    console.log("Produtos trócaveis:", exchangeableFormated);
    res.send(exchangeableFormated);
});

// ---------------- ROTA: Retorna produtos para substituição ----------------
router.put('/custom/getRemovableProducts', async (req, res) => {
  try {
    const { id, contact } = req.body;
    console.log('Requisição recebida em /custom/getRemovableProducts');
    console.log('Dados recebidos:', { id, contact });

    const produtos = bot.getRemovableProducts(contact.number);
    console.log('Produtos removíveis obtidos:', produtos);

    const produtosFormatados = await bot.sendProductsWithQuantity(produtos);
    console.log('Produtos formatados para envio:', produtosFormatados);

    res.send(produtosFormatados);
  } catch (error) {
    console.error('❌ Erro em /custom/getRemovableProducts:', error);
    res.status(500).send({ error: 'Erro ao obter produtos removíveis.' });
  }
});

// ---------------- ROTA: Adiciona subproduto customizado ----------------
router.put('/custom/addSubProduct', async (req, res) => {
    const { id, contact } = req.body;
    console.log("[/custom/addSubProduct] Requisição recebida");
    console.log("Contato:", contact);
    console.log("ID do subproduto:", id);

    const suport = bot.getSuportByContact(contact.number);
    console.log("Sessão ativa:", suport.sessionId);
    console.log("Produto antes da adição:", suport.currentProduct);

    bot.addSubProduct(id, suport.currentProduct);

    console.log("Produto após adição do subproduto:", suport.currentProduct);
    res.send(suport.currentProduct);
});

// ---------------- ROTA: Remove subproduto customizado ----------------
router.put('/custom/removeSubProduct', async (req, res) => {
    const { id, contact } = req.body;
    console.log("[/custom/removeSubProduct] Requisição recebida");
    console.log("Contato:", contact);
    console.log("ID do subproduto:", id);

    const suport = bot.getSuportByContact(contact.number);
    console.log("Sessão ativa:", suport.sessionId);
    console.log("Produto antes da adição:", suport.currentProduct);

    bot.removeFromCustomProduct(id, contact.number);

    console.log("Produto após adição do subproduto:", suport.currentProduct);
    res.send(suport.currentProduct);
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