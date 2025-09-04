const BACKEND_ORACLE_HOST = import.meta.env.BACKEND_ORACLE_HOST || 'http://localhost:8080';


export const ProductsService = {

    async getAllProducts() {
        const response = await fetch(`${BACKEND_ORACLE_HOST}/products/all`);
        if (!response.ok) {
            throw new Error('Erro ao buscar produtos');
        }
        return response.json();
    },

    async getProductById(id: string) {
        const response = await fetch(`${BACKEND_ORACLE_HOST}/products/${id}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar produto');
        }
        return response.json();
    },

    async createProduct(productData: unknown) {
        const response = await fetch(`${BACKEND_ORACLE_HOST}/products/new`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });
        if (!response.ok) {
            throw new Error('Erro ao criar produto');
        }
        return response.json();
    }
}