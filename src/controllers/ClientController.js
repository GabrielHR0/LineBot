const Client = require('../models/Client');

class ClientController {

    async pushOrcamento(_id, orcamentoId){
          await Client.updateOne(
            { _id },{
                $addToSet: { orcamentos: orcamentoId }
            }
        );
    }

    async findByNumber(number){
        return await Client.findOne({ number });
    }

    async getLastOrcamento(number){
        const client = await Client.findOne({number});
        const orcamento = await client.lastOrcamento();
        console.log(orcamento);
        let notification;
        return {notification, orcamento};
    }

    async getLastOrcamentoId(number){
        const client = await Client.findOne({number});
        const orcamento = await client.lastOrcamentoId();
        return orcamento;
    }


        getLastOrcamento222(contactNumber){
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