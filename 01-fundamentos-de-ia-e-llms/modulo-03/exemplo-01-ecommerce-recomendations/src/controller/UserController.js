/** Gerencia seleção de clientes e mudanças em seus históricos de compras. */
export class UserController {
    #userService;
    #userView;
    #events;
    /** Constrói o controller com dependências explícitas e testáveis. */
    constructor({
        userView,
        userService,
        events,
    }) {
        this.#userView = userView;
        this.#userService = userService;
        this.#events = events;
    }

    /** Fábrica de inicialização utilizada no ponto de entrada. */
    static init(deps) {
        return new UserController(deps);
    }

    /**
     * Carrega clientes, cadastra o usuário de cold start e prepara a interface.
     * Ao final, notifica o treinamento sobre a lista mais recente.
     */
    async renderUsers(nonTrainedUser) {
        const users = await this.#userService.getDefaultUsers();

        await this.#userService.addUser(nonTrainedUser);
        const defaultAndNonTrained = [nonTrainedUser, ...users];

        this.#userView.renderUserOptions(defaultAndNonTrained);
        this.setupCallbacks();
        this.setupPurchaseObserver();

        this.#events.dispatchUsersUpdated({ users: defaultAndNonTrained });

    }

    /** Conecta as ações visuais aos métodos do controller. */
    setupCallbacks() {
        this.#userView.registerUserSelectCallback(this.handleUserSelect.bind(this));
        this.#userView.registerPurchaseRemoveCallback(this.handlePurchaseRemove.bind(this));
    }

    /** Observa compras publicadas pelo ProductController. */
    setupPurchaseObserver() {

        this.#events.onPurchaseAdded(
            async (...data) => {
                return this.handlePurchaseAdded(...data);
            }
        );

    }

    /** Carrega o cliente selecionado e publica sua seleção para os demais módulos. */
    async handleUserSelect(userId) {
        const user = await this.#userService.getUserById(userId);
        this.#events.dispatchUserSelected(user);
        return this.displayUserDetails(user);
    }

    /** Adiciona a compra, persiste o cliente e solicita novo treinamento. */
    async handlePurchaseAdded({ user, product }) {
        const updatedUser = await this.#userService.getUserById(user.id);
        updatedUser.purchases.push({
            ...product
        })

        await this.#userService.updateUser(updatedUser);

        const lastPurchase = updatedUser.purchases[updatedUser.purchases.length - 1];
        this.#userView.addPastPurchase(lastPurchase);
        this.#events.dispatchUsersUpdated({ users: await this.#userService.getUsers() });
    }

    /** Remove uma ocorrência do produto comprado e persiste a alteração. */
    async handlePurchaseRemove({ userId, product }) {
        const user = await this.#userService.getUserById(userId);
        const index = user.purchases.findIndex(item => item.id === product.id);

        if (index !== -1) {
            user.purchases.splice(index, 1); // directly remove one item at the found index
            await this.#userService.updateUser(user);

            const updatedUsers = await this.#userService.getUsers();
            this.#events.dispatchUsersUpdated({ users: updatedUsers });
        }
    }


    /** Atualiza idade e histórico apresentados na área do cliente. */
    async displayUserDetails(user) {
        this.#userView.renderUserDetails(user);
        this.#userView.renderPastPurchases(user.purchases);

    }

    /** Expõe o id atualmente selecionado pela view. */
    getSelectedUserId() {
        return this.#userView.getSelectedUserId();
    }
}
