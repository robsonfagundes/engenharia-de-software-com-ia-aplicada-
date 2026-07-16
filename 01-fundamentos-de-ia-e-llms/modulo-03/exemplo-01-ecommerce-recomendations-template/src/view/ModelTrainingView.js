import { View } from './View.js';

/** Renderiza controles e informações do processo de treinamento. */
export class ModelView extends View {
    #trainModelBtn = document.querySelector('#trainModelBtn');
    #purchasesArrow = document.querySelector('#purchasesArrow');
    #purchasesDiv = document.querySelector('#purchasesDiv');
    #allUsersPurchasesList = document.querySelector('#allUsersPurchasesList');
    #runRecommendationBtn = document.querySelector('#runRecommendationBtn');
    #onTrainModel;
    #onRunRecommendation;

    /** Conecta os listeners dos controles assim que a view é criada. */
    constructor() {
        super();
        this.attachEventListeners();
    }

    /** Registra a ação solicitada pelo botão de treinamento. */
    registerTrainModelCallback(callback) {
        this.#onTrainModel = callback;
    }
    /** Registra a ação solicitada pelo botão de recomendação. */
    registerRunRecommendationCallback(callback) {
        this.#onRunRecommendation = callback;
    }

    /** Liga botões aos callbacks e controla a expansão do resumo de compras. */
    attachEventListeners() {
        this.#trainModelBtn.addEventListener('click', () => {
            this.#onTrainModel();
        });
        this.#runRecommendationBtn.addEventListener('click', () => {
            this.#onRunRecommendation();
        });

        this.#purchasesDiv.addEventListener('click', () => {
            const purchasesList = this.#allUsersPurchasesList;

            const isHidden = purchasesList.hidden;

            if (isHidden) {
                purchasesList.hidden = false;
                this.#purchasesDiv.setAttribute('aria-expanded', 'true');
                this.#purchasesArrow.classList.remove('bi-chevron-down');
                this.#purchasesArrow.classList.add('bi-chevron-up');
            } else {
                purchasesList.hidden = true;
                this.#purchasesDiv.setAttribute('aria-expanded', 'false');
                this.#purchasesArrow.classList.remove('bi-chevron-up');
                this.#purchasesArrow.classList.add('bi-chevron-down');
            }
        });

    }
    /** Habilita recomendação quando modelo e cliente estão disponíveis. */
    enableRecommendButton() {
        this.#runRecommendationBtn.disabled = false;
    }
    /** Mostra estado de processamento e restaura o botão ao concluir. */
    updateTrainingProgress(progress) {
        this.#trainModelBtn.disabled = true;
        this.#trainModelBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span>Treinando...</span>';

        if (progress.progress === 100) {
            this.#trainModelBtn.disabled = false;
            this.#trainModelBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i><span>Treinar novamente</span>';
        }
    }

    /** Lista as compras que formam os exemplos de treinamento do modelo. */
    renderAllUsersPurchases(users) {
        const html = users.map(user => {
            const purchasesHtml = user.purchases.map(purchase => {
                return `<span class="badge bg-light text-dark me-1 mb-1">${purchase.name}</span>`;
            }).join('');

            return `
                <div class="user-purchase-summary">
                    <h6>${user.name} · ${user.age} anos</h6>
                    <div class="purchases-badges">
                        ${purchasesHtml || '<span class="text-muted">Sem compras</span>'}
                    </div>
                </div>
            `;
        }).join('');

        this.#allUsersPurchasesList.innerHTML = html;
    }
}
