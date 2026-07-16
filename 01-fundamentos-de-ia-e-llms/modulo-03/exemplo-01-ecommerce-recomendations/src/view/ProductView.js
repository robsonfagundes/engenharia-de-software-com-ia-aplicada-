import { View } from './View.js';

/** Renderiza, pesquisa e filtra o catálogo, sem acessar regras de persistência. */
export class ProductView extends View {
    // Referências aos elementos do catálogo no DOM.
    #productList = document.querySelector('#productList');
    #productSearch = document.querySelector('#productSearch');
    #categoryFilter = document.querySelector('#categoryFilter');
    #productCount = document.querySelector('#productCount');

    #buttons;
    #products = [];
    #disableButtons = true;
    #isRecommendationList = false;
    // Template carregado sob demanda e callback injetado pelo controller.
    #productTemplate;
    #onBuyProduct;

    /** Inicia o carregamento do template de card. */
    constructor() {
        super();
        this.init();
    }

    /** Carrega o HTML reutilizável e conecta filtros de texto e categoria. */
    async init() {
        this.#productTemplate = await this.loadTemplate('./src/view/templates/product-card.html');
        this.attachFilterListeners();
        if (this.#products.length) this.renderFilteredProducts();
    }

    /** Libera os botões de compra quando há um cliente selecionado. */
    onUserSelected(user) {
        // Enable buttons if a user is selected, otherwise disable them
        this.setButtonsState(user.id ? false : true);
    }

    /** Registra a função que tratará uma compra fora da camada visual. */
    registerBuyProductCallback(callback) {
        this.#onBuyProduct = callback;
    }

    /** Atualiza a fonte local do catálogo e solicita sua renderização. */
    render(products, disableButtons = true) {
        this.#products = products;
        this.#disableButtons = disableButtons;
        this.#isRecommendationList = products.some(product => Number.isFinite(product.score));
        if (!this.#productTemplate) return;
        this.renderCategoryOptions(products);
        this.renderFilteredProducts();
    }

    /** Converte produtos em cards e trata o estado de resultado vazio. */
    renderProductCards(products) {
        if (!products.length) {
            this.#productList.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-search"></i>
                    <strong>Nenhum produto encontrado</strong>
                    <span>Tente buscar outro nome, cor ou categoria.</span>
                </div>`;
            this.#productCount.textContent = '0 produtos';
            return;
        }

        const html = products.map(product => {
            const score = Number.isFinite(product.score)
                ? Math.round(Math.max(0, Math.min(1, product.score)) * 100)
                : null;
            return this.replaceTemplate(this.#productTemplate, {
                id: product.id,
                name: product.name,
                category: product.category,
                price: Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                color: product.color,
                recommendationBadge: score === null
                    ? ''
                    : `<span class="recommendation-score"><i class="bi bi-stars"></i>${score}% compatível</span>`,
                product: JSON.stringify(product)
            });
        }).join('');

        this.#productList.innerHTML = html;
        this.attachBuyButtonListeners();
        this.setButtonsState(this.#disableButtons);
        const label = this.#isRecommendationList
            ? (products.length === 1 ? 'recomendação' : 'recomendações')
            : (products.length === 1 ? 'produto' : 'produtos');
        this.#productCount.textContent = `${products.length} ${label}`;
    }

    /** Recria as opções de categoria preservando uma seleção ainda válida. */
    renderCategoryOptions(products) {
        const selectedCategory = this.#categoryFilter.value;
        const categories = [...new Set(products.map(product => product.category))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
        this.#categoryFilter.innerHTML = '<option value="">Todas as categorias</option>' + categories
            .map(category => `<option value="${category}">${category}</option>`)
            .join('');
        this.#categoryFilter.value = categories.includes(selectedCategory) ? selectedCategory : '';
    }

    /** Aplica simultaneamente a busca textual e o filtro de categoria. */
    renderFilteredProducts() {
        const searchTerm = this.#productSearch.value.trim().toLocaleLowerCase('pt-BR');
        const category = this.#categoryFilter.value;
        const filteredProducts = this.#products.filter(product => {
            const searchableContent = `${product.name} ${product.category} ${product.color}`.toLocaleLowerCase('pt-BR');
            return (!searchTerm || searchableContent.includes(searchTerm)) && (!category || product.category === category);
        });
        this.renderProductCards(filteredProducts);
    }

    /** Faz filtros reagirem imediatamente às alterações do usuário. */
    attachFilterListeners() {
        this.#productSearch.addEventListener('input', () => this.renderFilteredProducts());
        this.#categoryFilter.addEventListener('change', () => this.renderFilteredProducts());
    }

    /** Habilita ou desabilita todos os botões de compra renderizados. */
    setButtonsState(disabled) {
        this.#disableButtons = disabled;
        if (!this.#buttons) {
            this.#buttons = document.querySelectorAll('.buy-now-btn');
        }
        this.#buttons.forEach(button => {
            button.disabled = disabled;
        });
    }

    /** Conecta os cards ao callback de compra e mostra confirmação temporária. */
    attachBuyButtonListeners() {
        this.#buttons = document.querySelectorAll('.buy-now-btn');
        this.#buttons.forEach(button => {

            button.addEventListener('click', (event) => {
                const product = JSON.parse(button.dataset.product);
                const originalText = button.innerHTML;

                button.innerHTML = '<i class="bi bi-check-circle-fill"></i><span>Adicionado</span>';
                button.classList.remove('btn-primary');
                button.classList.add('btn-success');
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.classList.remove('btn-success');
                    button.classList.add('btn-primary');
                }, 900);
                this.#onBuyProduct(product, button);

            });
        });
    }
}
