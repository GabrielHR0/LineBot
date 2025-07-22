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

    async createCopy(orcamento){
        return await Orcamento.create(
            {
                client : orcamento.client,
                items : orcamento.items,
                total : orcamento.total
            }
        );
    }

    async create(clientId){
        return await Orcamento.createOcamento(clientId);
    }

    async getItems(_id){
        const orcamento = await Orcamento.findOne({_id});

        const products = [];
        for (let i = 0; i < orcamento.items.length; i++){
            const item = orcamento.items[i];
            const modelName = item.itemType;
            
            await orcamento.populate({
                path: `items.${i}.product`,
                model: modelName
            });

            products.push({
                _id: item.product._id,
                name: item.product.name,
                price: item.product.price,
                quantity: item.quantity
            })
        }

        return products;
    }

    async addItem(orcamentoId, item, quantity){
        const orcamento = await Orcamento.findOne({_id : orcamentoId});
        await orcamento.addItem(item.id, item.constructor.modelName, quantity);

        const newPrice = await this.calculatePrice(orcamento);
        orcamento.updatePrice(newPrice);
        await orcamento.save();
        
        return orcamento;
    }

    async removeItem(orcamentoId, item, quantity){
        const orcamento = await Orcamento.findOne({_id : orcamentoId});
        orcamento.removeItem(item.id, item.constructor.modelName, quantity);
        return orcamento;
    }

    async updatePrice(orcamento){
        const newPrice = await this.calculatePrice(orcamento);
        console.log("Orcamento: ", orcamento);
        orcamento.updatePrice(newPrice);
        await orcamento.save();
    }
    
    async calculatePrice(orcamento) {

        let total = 0;
        for (let i = 0; i < orcamento.items.length; i++) {
            const item = orcamento.items[i];
            const modelName = item.itemType;

            await orcamento.populate({
                path: `items.${i}.product`,
                model: modelName,
            });

            const price = item.product.price || 0;
            const quantity = item.quantity || 1;

            total += price * quantity;
        }
        return total;
    }
    
    async resume(orcamentoId, notification){
        const orcamento = orcamentoId.constructor?.modelName == 'Orcamento' ?
        orcamentoId : await Orcamento.findOne({ _id: orcamentoId });

        if (!orcamento) throw new Error('Orçamento não encontrado');

        for (let i = 0; i < orcamento.items.length; i++){
            const item = orcamento.items[i];
            const modelName = item.itemType;
            
            await orcamento.populate({
                path: `items.${i}.product`,
                model: modelName
            });
        }

        console.log("Orcamento:", orcamento);

        const orcamentoResume = await orcamento.resume();
        const resumeArray = orcamentoResume.items.map((item, index) => {
            return `${index + 1}. ${item.quantity}x ${item.name}: R$${item.price}`;
        })

        resumeArray.push(`\nTotal: R$${orcamentoResume.total}`);
        return { "@resumo": resumeArray.join("\n"), "@notification" : notification ?? ""};
    }

    async verifyAtualization(orcamentoId){

    }
}

module.exports = new OrcamentoController();
