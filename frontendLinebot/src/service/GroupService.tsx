const BACKEND_ORACLE_HOST = import.meta.env.BACKEND_ORACLE_HOST || 'http://localhost:8080';

export const GroupService = {

    async getAllGroups() {
        const response = await fetch(`${BACKEND_ORACLE_HOST}/groups/`);
        if (!response.ok) {
            throw new Error('Erro ao buscar grupos');
        }
        return response.json();
    },

    async getGroupById(id: string) {
        const response = await fetch(`${BACKEND_ORACLE_HOST}/groups/${id}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar grupo');
        }
        return response.json();
    },

    async createGroup(groupData: unknown) {
        const response = await fetch(`${BACKEND_ORACLE_HOST}/groups/new`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(groupData)
        });
        if (!response.ok) {
            throw new Error('Erro ao criar grupo');
        }
        return response.json();
    }
}