const router = require('express').Router();
const Oracle = require('../model/Oracle');

// ObjectControl = require('../model/ObjectControl');


const oracle = new Oracle(process.env.BACKEND_ORACLE_HOST);
//const objectControl = new ObjectControl();

router.put('/initSuport', async (req, res) => {
    const { id, contact } = req.body;
    console.log("[DEBUG] Dados recebidos na rota /initSuport:", contact); // VERIFICAÇÃO
    const response = await oracle.sendData("/lineBot/initSuport", { contact });
    res.send({ "isReturnData": true, "data": response });
});

router.put('/exitSuport', async (req, res) => {
    const { contact } = req.body;
    const result = await oracle.sendData("/lineBot/exitSuport", {contact});
    res.send({ "isReturnData": false});
})

router.put('/customizableKits', async (req, res) =>{
    const result = await oracle.sendData("/lineBot/customizableKits");                              
    res.send({ "isReturnData": true, "data": result });
})

router.put('/nonCustomizableKits', async (req, res) =>{
    const result = await oracle.sendData("/lineBot/nonCustomizableKits");
    res.send({ "isReturnData": true, "data": result });
})

router.put('/allProducts', async (req, res) =>{
    const result = await oracle.sendData("/lineBot/allProducts");                              
    res.send({ "isReturnData": true, "data": result });
})

router.put('/selectProduct', async (req, res) => {
    const { id, contact } = req.body;
    const result = await oracle.sendData("/lineBot/selectProduct", {id, contact});
    res.send({ "isReturnData": true, "data": result });
})

router.put('/addToOrcamento', async (req, res) => {
    const { id, contact } = req.body;
    const result = await oracle.sendData("/lineBot/addToOrcamento", { id, contact });
    res.send(result);
});

router.put('/resumoOrcamento', async (req, res) => {
    const {id, contact} = req.body;
    const result = await oracle.sendData("/lineBot/resumoOrcamento", { id, contact });
    res.send({ "isReturnData": true, "data": result });
})

router.put('/saveOrcamento', async (req, res) => {
    const {id, contact} = req.body;
    const result = await oracle.sendData("/lineBot/saveOrcamento", { contact });
    res.send({ "isReturnData": false, "data": result });
})

router.put('/custom/init', async (req, res) =>{
    const {id, contact} = req.body;
    const result = await oracle.sendData("/lineBot/custom/init", {id, contact});
    res.send({ "isReturnData": true, "data": result });
})

router.put('/custom/allSubProducts', async (req, res) =>{
    const {id, contact} = req.body;
    const result = await oracle.sendData("/lineBot/custom/allSubProducts", {id, contact});                              
    res.send({ "isReturnData": true, "data": result });
})

router.put('/custom/getRemovableProducts', async (req, res) =>{
    const {id, contact} = req.body;
    const result = await oracle.sendData("/lineBot/custom/getRemovableProducts", {id, contact});                              
    res.send({ "isReturnData": true, "data": result });
})

router.put('/custom/addSubProduct', async (req, res) =>{
    const {id, contact} = req.body;
    const result = await oracle.sendData("/lineBot/custom/addSubProduct", {id, contact});                              
    res.send({ "isReturnData": true, "data": result });
})

router.put('/custom/removeSubProduct', async (req, res) =>{
    const {id, contact} = req.body;
    const result = await oracle.sendData("/lineBot/custom/removeSubProduct", {id, contact});                              
    res.send({ "isReturnData": true, "data": result });
})

router.put('/getSubProducts', async (req, res) =>{
    const {id, contact} = req.body;
    const result = await oracle.sendData("/lineBot/getSubProducts", {id, contact});                              
    res.send({ "isReturnData": true, "data": result });
})

router.put('/custom/getExchangeableProducts', async (req, res) =>{
    const {id, contact} = req.body;
    const result = await oracle.sendData("/lineBot/custom/getExchangeableProducts", {id});                              
    res.send({ "isReturnData": true, "data": result });
})

router.put('/detailProduct', async (req, res) => {
    const {id, contact} = req.body;
    const result = await oracle.sendData('/lineBot/detailProduct', {contact});
    res.send({ "isReturnData": true, "data": result });
})

router.put('/ultimoOrcamento', async (req, res) => {
    const {id, contact} = req.body;
    const result = await oracle.sendData('/lineBot/ultimoOrcamento', {id, contact});
    res.send({ "isReturnData": true, "data": result });
})

router.put('/makeOrder', async (req, res) => {
    const {id, contact} = req.body;
    const result = await oracle.sendData('/lineBot/makeOrder', {contact});
    res.send({"isReturnData": true, "data": result});
})

router.put('/previewOrder', async (req, res) => {
    const {id, contact} = req.body;
    const result = await oracle.sendData('/lineBot/previewOrder', {contact});
    res.send({"isReturnData": true, "data": result});
})

router.put('/holdContact', async (req, res) => {
    const {id, contact} = req.body;
    const result = await oracle.sendData('/lineBot/holdContact', {contact});
    res.send({"isReturnData": true, "data": result});
})

router.put('/validateDate', async (req, res) => {
    console.log("[ROTA] /validateDate - Dados recebidos:", req.body);
    const { date } = req.body;
    console.log("[ROTA] /validateDate - Data recebida:", date);

    const result = await oracle.sendData('/lineBot/validateDate', { date });
    console.log("[ROTA] /validateDate - Resultado:", result);
    res.send({ "isReturnData": true, ...result });
});

router.put('/availableTimeSlots', async (req, res) => {
    const { date } = req.body;
    console.log("Data: ", date);
    const result = await oracle.sendData('/lineBot/availableTimeSlots', { date });
    res.send({ "isReturnData": true, data: result });
});

router.put('/selectTime', async (req, res) => {
    const { id, contact } = req.body;
    console.log("Id: ", id);
    console.log("Contato: ", contact);
    const result = await oracle.sendData('/lineBot/selectTime', { id, contact });
    res.send({ "isReturnData": true, data: result });
});

router.put('/resumeAppointment', async (req, res) => {
    const { id, date, contact } = req.body;
    const result = await oracle.sendData('/lineBot/resumeAppointment', { id, date, contact });
    res.send({ "isReturnData": true, data: result });
});

module.exports = router;
