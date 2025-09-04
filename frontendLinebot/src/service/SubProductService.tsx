const BACKEND_ORACLE_HOST = import.meta.env.BACKEND_ORACLE_HOST || 'http://localhost:8080';

export const SubProductService = {

    async create(data: unknown) {
        const response = await fetch(`${BACKEND_ORACLE_HOST}/subproducts/new`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error('Erro ao criar subproduto');
        }
        return response.json();
    }
}
