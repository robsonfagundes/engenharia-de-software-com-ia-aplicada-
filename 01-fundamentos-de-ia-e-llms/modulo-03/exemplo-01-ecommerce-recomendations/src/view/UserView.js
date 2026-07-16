import { View } from './View.js';

/** Cuida da seleção, detalhes e histórico visual de clientes. */
export class UserView extends View {
    #userSelect = document.querySelector('#userSelect');
    #userAge = document.querySelector('#userAge');
    #pastPurchasesList = document.querySelector('#pastPurchasesList');

    #purchaseTemplate;
    #onUserSelect;
    #onPurchaseRemove;
    #pastPurchaseElements = [];

    /** Inicia o carregamento assíncrono do template de compra. */
    constructor() {
        super();
        this.init();
    }

    /** Carrega o template e conecta o seletor de clientes. */
    async init() {
        this.#purchaseTemplate = await this.loadTemplate('./src/view/templates/past-purchase.html');
        this.attachUserSelectListener();
    }

    /** Registra o callback executado ao selecionar um cliente. */
    registerUserSelectCallback(callback) {
        this.#onUserSelect = callback;
    }

    /** Registra o callback executado ao remover uma compra. */
    registerPurchaseRemoveCallback(callback) {
        this.#onPurchaseRemove = callback;
    }

    /** Constrói as opções do seletor a partir dos clientes recebidos. */
    renderUserOptions(users) {
        const options = users.map(user => {
            return `<option value="${user.id}">${user.name}</option>`;
        }).join('');

        this.#userSelect.innerHTML += options;
    }

    /** Exibe os dados básicos do cliente selecionado. */
    renderUserDetails(user) {
        this.#userAge.value = user.age;
    }

    /** Renderiza o histórico ou uma mensagem para cliente sem compras. */
    renderPastPurchases(pastPurchases) {
        if (!this.#purchaseTemplate) return;

        if (!pastPurchases || pastPurchases.length === 0) {
            this.#pastPurchasesList.innerHTML = '<div class="empty-state compact"><i class="bi bi-bag-x"></i><span>Este usuário ainda não possui compras.</span></div>';
            return;
        }

        const html = pastPurchases.map(product => {
            return this.replaceTemplate(this.#purchaseTemplate, {
                ...product,
                price: Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                product: JSON.stringify(product)
            });
        }).join('');

        this.#pastPurchasesList.innerHTML = html;
        this.attachPurchaseClickHandlers();
    }

    /** Insere uma compra no topo e aplica um destaque temporário. */
    addPastPurchase(product) {

        if (this.#pastPurchasesList.querySelector('.empty-state')) {
            this.#pastPurchasesList.innerHTML = '';
        }

        const purchaseHtml = this.replaceTemplate(this.#purchaseTemplate, {
            ...product,
            price: Number(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            product: JSON.stringify(product)
        });

        this.#pastPurchasesList.insertAdjacentHTML('afterbegin', purchaseHtml);

        const newPurchase = this.#pastPurchasesList.firstElementChild;
        newPurchase.classList.add('past-purchase-highlight');

        setTimeout(() => {
            newPurchase.classList.remove('past-purchase-highlight');
        }, 1000);

        this.attachPurchaseClickHandlers();
    }

    /** Publica a troca de cliente e limpa os detalhes sem uma seleção. */
    attachUserSelectListener() {
        this.#userSelect.addEventListener('change', (event) => {
            const userId = event.target.value ? Number(event.target.value) : null;

            if (userId) {
                if (this.#onUserSelect) {
                    this.#onUserSelect(userId);
                }
            } else {
                this.#userAge.value = '';
                this.#pastPurchasesList.innerHTML = '<div class="empty-state compact"><i class="bi bi-person-check"></i><span>Selecione um usuário para ver o histórico.</span></div>';
            }
        });
    }

    /** Conecta cada compra à remoção visual e persistente. */
    attachPurchaseClickHandlers() {
        this.#pastPurchaseElements = [];

        const purchaseElements = document.querySelectorAll('.past-purchase');

        purchaseElements.forEach(purchaseElement => {
            this.#pastPurchaseElements.push(purchaseElement);

            purchaseElement.onclick = (event) => {

                const product = JSON.parse(purchaseElement.dataset.product);
                const userId = this.getSelectedUserId();
                const element = purchaseElement;

                this.#onPurchaseRemove({ element, userId, product });

                element.style.transition = 'opacity 0.5s ease';
                element.style.opacity = '0';

                setTimeout(() => {
                    element.remove();

                    if (document.querySelectorAll('.past-purchase').length === 0) {
                        this.renderPastPurchases([]);
                    }

                }, 500);

            }
        });
    }

    /** Retorna o id numérico selecionado ou null. */
    getSelectedUserId() {
        return this.#userSelect.value ? Number(this.#userSelect.value) : null;
    }
}
