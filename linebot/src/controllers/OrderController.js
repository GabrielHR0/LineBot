const Order =  require('../models/Order');

class OrderController {

    async create(orcamento){
        const items = orcamento.items.map(item =>{
            return {
                name: item.product.name,
                price: item.product.price,
                status: 'pending',
                itemType: item.itemType,
                product: item.product._id,
                quantity: item.quantity
            }
        })
        return await Order.create({
            client: orcamento.client,
            items: items,
            total: orcamento.total,
            status: 'pending',
        })
    }

    async createPreview(orcamento) {
        const resumo = orcamento.items.map((item, index) => 
            `${index + 1}. ${item.quantity}x ${item.product.name} - R$ ${((item.product.price * item.quantity)/100).toFixed(2)}`
        );

        return resumo.join('\n');
    }
}

module.exports = new OrderController();