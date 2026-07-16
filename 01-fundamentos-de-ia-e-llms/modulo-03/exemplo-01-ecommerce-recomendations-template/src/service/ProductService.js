/** Centraliza o acesso do navegador aos endpoints de produtos. */
export class ProductService {
    /** Retorna o catálogo completo usado pela tela e pelo treinamento. */
    async getProducts() {
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Não foi possível carregar os produtos');
        return await response.json();
    }

    /** Localiza um produto pelo id a partir do catálogo retornado pela API. */
    async getProductById(id) {
        const products = await this.getProducts();
        return products.find(product => product.id === id);
    }

    /** Filtra vários produtos pelos ids informados. */
    async getProductsByIds(ids) {
        const products = await this.getProducts();
        return products.filter(product => ids.includes(product.id));
    }
}
