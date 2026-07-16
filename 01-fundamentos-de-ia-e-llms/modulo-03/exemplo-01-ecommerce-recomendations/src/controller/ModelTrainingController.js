/** Coordena os comandos da área de treinamento e recomendação. */
export class ModelController {
    #modelView;
    #userService;
    #events;
    #currentUser = null;
    #alreadyTrained = false;
    /** Armazena dependências e inicia os listeners do módulo. */
    constructor({
        modelView,
        userService,
        events,
    }) {
        this.#modelView = modelView;
        this.#userService = userService;
        this.#events = events;

        this.init();
    }

    /** Cria o controller usando injeção de dependências. */
    static init(deps) {
        return new ModelController(deps);
    }

    /** Prepara os callbacks da view e do barramento de eventos. */
    async init() {
        this.setupCallbacks();
    }

    /**
     * Habilita/desabilita ações conforme usuário e modelo e encaminha as
     * atualizações de clientes e progresso para a view.
     */
    setupCallbacks() {
        this.#modelView.registerTrainModelCallback(this.handleTrainModel.bind(this));
        this.#modelView.registerRunRecommendationCallback(this.handleRunRecommendation.bind(this));

        this.#events.onUserSelected((user) => {
            this.#currentUser = user;
            if (!this.#alreadyTrained) return
            this.#modelView.enableRecommendButton();
        });

        this.#events.onTrainingComplete(() => {
            this.#alreadyTrained = true;
            if (!this.#currentUser) return
            this.#modelView.enableRecommendButton();
        })

        this.#events.onUsersUpdated(
            async (...data) => {
                return this.refreshUsersPurchaseData(...data);
            }
        );
        this.#events.onProgressUpdate(
            (progress) => {
                this.handleTrainingProgressUpdate(progress);
            }
        );

    }


    /** Obtém dados atuais do MongoDB e solicita treinamento ao worker. */
    async handleTrainModel() {
        const users = await this.#userService.getUsers();

        this.#events.dispatchTrainModel(users);
    }

    /** Reflete visualmente o percentual de treinamento recebido. */
    handleTrainingProgressUpdate(progress) {
        this.#modelView.updateTrainingProgress(progress);
    }
    /** Recarrega o cliente para recomendar com as compras mais recentes. */
    async handleRunRecommendation() {
        const currentUser = this.#currentUser;
        const updatedUser = await this.#userService.getUserById(currentUser.id);
        this.#events.dispatchRecommend(updatedUser);
    }

    /** Exibe um resumo das compras usadas como dados de treinamento. */
    async refreshUsersPurchaseData({ users }) {
        this.#modelView.renderAllUsersPurchases(users);
    }
}
