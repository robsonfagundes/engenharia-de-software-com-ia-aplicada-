/** Coordena catálogo, seleção do cliente e ações de compra. */
export class ProductController {
    #productView;
    #currentUser = null;
    #events;
    #productService;
    /** Recebe as dependências para manter o controller desacoplado do DOM. */
    constructor({
        productView,
        events,
        productService
    }) {
        this.#productView = productView;
        this.#productService = productService;
        this.#events = events;
        this.init();
    }

    /** Fábrica usada pelo arquivo principal para inicializar o controller. */
    static init(deps) {
        return new ProductController(deps);
    }

    /** Registra eventos e exibe o catálogo inicial. */
    async init() {
        this.setupCallbacks();
        this.setupEventListeners();
        const products = await this.#productService.getProducts();
        this.#productView.render(products, true);
    }

    /**
     * Reage à seleção de cliente e às recomendações produzidas pelo worker.
     * A seleção dispara automaticamente uma nova busca/recomendação.
     */
    setupEventListeners() {

        this.#events.onUserSelected((user) => {
            this.#currentUser = user;
            this.#productView.onUserSelected(user);
            this.#events.dispatchRecommend(user)
        })

        this.#events.onRecommendationsReady(({ recommendations }) => {
            this.#productView.render(recommendations, false);
        });
    }

    /** Liga o botão de compra da view à regra do controller. */
    setupCallbacks() {
        this.#productView.registerBuyProductCallback(this.handleBuyProduct.bind(this));
    }

    /** Publica a compra para que o UserController atualize o MongoDB. */
    async handleBuyProduct(product) {
        const user = this.#currentUser;
        this.#events.dispatchPurchaseAdded({ user, product });
    }

}
