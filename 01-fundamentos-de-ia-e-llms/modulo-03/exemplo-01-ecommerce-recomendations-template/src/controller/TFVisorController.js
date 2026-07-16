
/** Encaminha métricas de treinamento para o painel do TensorFlow Visor. */
export class TFVisorController {
    #tfVisorView;
    #events;
    /** Inicializa a integração entre eventos e visualização. */
    constructor({
        tfVisorView,
        events,
    }) {
        this.#tfVisorView = tfVisorView;
        this.#events = events;

        this.init();
    }

    /** Fábrica usada para criar o controller. */
    static init(deps) {
        return new TFVisorController(deps);
    }

    /** Registra os eventos que alimentam e reiniciam o painel. */
    async init() {
        this.setupCallbacks();
    }

    /** Limpa gráficos em novo treino e adiciona métricas a cada época. */
    setupCallbacks() {
        this.#events.onTrainModel(() => {
            this.#tfVisorView.resetDashboard();
        });

        this.#events.onTFVisLogs(
            (log) => {
                this.#tfVisorView.handleTrainingLog(log);
            }
        );
    }

}
