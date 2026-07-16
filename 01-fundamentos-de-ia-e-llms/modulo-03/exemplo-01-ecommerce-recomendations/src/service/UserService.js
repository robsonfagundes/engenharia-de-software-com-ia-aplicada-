/**
 * Encapsula a comunicação com a API de clientes. A persistência que antes
 * usava sessionStorage agora é feita no MongoDB pelo servidor Node.js.
 */
export class UserService {
    /** Mantém compatibilidade com o fluxo original e retorna os clientes salvos. */
    async getDefaultUsers() {
        return this.getUsers();
    }

    /** Lista clientes e históricos de compras. */
    async getUsers() {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Não foi possível carregar os clientes');
        return response.json();
    }

    /** Busca um cliente usando seu identificador numérico. */
    async getUserById(userId) {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) throw new Error('Cliente não encontrado');
        return response.json();
    }

    /** Atualiza os dados e as compras de um cliente existente. */
    async updateUser(user) {
        const response = await fetch(`/api/users/${user.id}`, {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(user),
        });
        if (!response.ok) throw new Error('Não foi possível atualizar o cliente');
        return response.json();
    }

    /** Insere um cliente novo; a API também protege contra ids duplicados. */
    async addUser(user) {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(user),
        });
        if (!response.ok) throw new Error('Não foi possível adicionar o cliente');
        return response.json();
    }


}
