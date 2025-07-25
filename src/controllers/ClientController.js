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

    async getLastOrcamento(number) {
        try {
            const client = await Client.findOne({ number });
            
            if (!client) {
                return { 
                    notification: {
                        type: 'error',
                        message: 'Cliente não encontrado'
                    },
                    orcamento: null
                };
            }

            const orcamento = await client.lastOrcamento();
            
            if (!orcamento) {
                return {
                    notification: 'Nenhum orçamento salvo anteriormente foi encontrado para este cliente',
                    orcamento: null
                };
            }

            return {
                notification,
                orcamento
            };
            
        } catch (error) {
            console.error('Erro ao buscar último orçamento:', error);
            return {
                notification: 'Ocorreu um erro ao buscar o último orçamento',
                orcamento: null
            };
        }
    }
    async getLastOrcamentoId(number){
        const client = await Client.findOne({number});
        const orcamento = await client.lastOrcamentoId();
        return orcamento;
    }

}
module.exports = new ClientController();