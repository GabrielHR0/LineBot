const Client = require('../models/Client');

class ClientController {

    async pushOrcamento(clientId, orcamentoId){
        const client = await Client.findOne(clientId);
        client.addOrcamento(orcamentoId);
    }

    getLastOrcamento(clientId){
        const client = Client.findOne(clientId);
        
    }
        getLastOrcamento(contactNumber){
            const client = this.buscarCliente(contactNumber);
            const orcamento = client.lastOrcamento();
            
            let notification = null;
            let alteracao = false;
            orcamento.products.forEach(product => {
                if (product.hasSubProducts()){
                    product.subProducts.forEach(sub => {
                        const foundSub = subproducts.find(sub._key);
                        if (foundSub.bundlePrice !== sub.bundlePrice){
                            sub.bundlePrice = foundSub.bundlePrice;
                            alteracao = true;
                        }
                    })
                }
            })
            if (alteracao){
                notification = `\n\nOs valores do seu orçamento foram ajustados conforme a nova tabela de preços.` 
            }
            console.log(orcamento)
            return this.resumeOrcamento(orcamento, notification);
        }
}
module.exports = new ClientController();