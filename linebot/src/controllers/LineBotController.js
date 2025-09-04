class lineBotCotroller {

    async sendProductsWithQuantity(produtos) {
        return produtos.map(product => ({
            value: `${product.quantity}x ${product.name}`,
            id: product._id
        }));
    }

    async sendProductsWithoutQuantity(produtos) {
        return produtos.map(product => ({
            value: product.name,
            id: product._id
        }));
    }
}

module.exports = new lineBotCotroller();