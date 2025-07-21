const  Orcamento  = require('../models/Orcamento');
const { productEvents, PRODUCT_UPDATED } = require('../events/productEvents');

class OrcamentoController {

    constructor() {
        // Registra listener para eventos de produto
        productEvents.on(PRODUCT_UPDATED, this.updateOrcamentosWithProduct.bind(this));
    }

    async updateOrcamentosWithProduct({ productId, newPrice }) {
        console.log(`📢 Atualizando orçamentos para o produto ${productId}...`);
        
        await Orcamento.updateMany(
        { 'products.product': productId },
        { $set: { 'products.$.price': newPrice } }
        );
        
        console.log('✅ Orçamentos atualizados!');
    }

    async create(clientId){
        return await Orcamento.createOcamento(clientId);
    }

    async getItems(_id){
        const orcamento = await Orcamento.finOne({_id});
        orcamento.populate('items');
    }

    async addItem(orcamentoId, item, quantity){
        const orcamento = await Orcamento.findOne({_id : orcamentoId});
        await orcamento.addItem(item.id, item.constructor.modelName, quantity);
        return orcamento;
    }

    async removeItem(orcamentoId, item, quantity){
        const orcamento = await Orcamento.findOne({_id : orcamentoId});
        orcamento.removeItem(item.id, item.constructor.modelName, quantity);
        return orcamento;
    }

    async resume(orcamentoId, notification){
        const orcamento = await Orcamento.findOne({ _id : orcamentoId});
        if (!orcamento){
            throw new Error("Orcamento não encontrado");
        }
        const orcamentoResume = await orcamento.resume();
        const resumeArray = orcamentoResume.items.map((item, index) => {
            return `${index + 1}. ${item.name}: R$${item.price}`;
        })

        resumeArray.push(`\nTotal: R$${orcamentoResume.total}`);
        return { "@resumo": resumeArray.join("\n"), "@notification" : notification ?? ""};
    }


    async verifyAtualization(orcamentoId){

    }
}

module.exports = new OrcamentoController();
