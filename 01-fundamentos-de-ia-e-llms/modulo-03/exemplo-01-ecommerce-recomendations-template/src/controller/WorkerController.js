import { workerEvents } from "../events/constants.js";

/** Faz a ponte entre eventos da página e mensagens do Web Worker. */
export class WorkerController {
    #worker;
    #events;
    #alreadyTrained = false;
    #pendingRecommendation = null;
    /** Guarda o worker e o barramento e prepara a comunicação assíncrona. */
    constructor({ worker, events }) {
        this.#worker = worker;
        this.#events = events;
        this.#alreadyTrained = false;
        this.init();
    }

    /** Delega a configuração inicial dos listeners. */
    async init() {
        this.setupCallbacks();
    }

    /** Executa a inicialização sem expor o construtor ao ponto de entrada. */
    static init(deps) {
        return new WorkerController(deps);
    }

    /** Registra os callbacks de entrada e saída do worker. */
    setupCallbacks() {
        this.#events.onTrainModel((data) => {
            this.#alreadyTrained = false;
            this.triggerTrain(data);
        });
        this.#events.onTrainingComplete(() => {
            this.#alreadyTrained = true;

            if (this.#pendingRecommendation) {
                const user = this.#pendingRecommendation;
                this.#pendingRecommendation = null;
                this.triggerRecommend(user);
            }
        });

        this.#events.onRecommend((data) => {
            if (!this.#alreadyTrained) {
                // Mantém somente a seleção mais recente enquanto o modelo treina.
                this.#pendingRecommendation = data;
                return;
            }

            this.triggerRecommend(data);

        });

        const eventsToIgnoreLogs = [
            workerEvents.progressUpdate,
            workerEvents.trainingLog,
            workerEvents.tfVisData,
            workerEvents.tfVisLogs,
            workerEvents.trainingComplete,
        ]
        this.#worker.onmessage = (event) => {
            if (!eventsToIgnoreLogs.includes(event.data.type))
                console.log(event.data);

            // Traduz cada tipo de mensagem do worker para um evento da página.
            if (event.data.type === workerEvents.progressUpdate) {
                this.#events.dispatchProgressUpdate(event.data.progress);
            }

            if (event.data.type === workerEvents.trainingComplete) {
                this.#events.dispatchTrainingComplete(event.data);
            }

            // Encaminha dados iniciais para a visualização do TFVisor.
            if (event.data.type === workerEvents.tfVisData) {
                this.#events.dispatchTFVisorData(event.data.data);
            }

            // Encaminha as métricas produzidas ao final de cada época.
            if (event.data.type === workerEvents.trainingLog) {
                this.#events.dispatchTFVisLogs(event.data);
            }
            if (event.data.type === workerEvents.recommend) {
                this.#events.dispatchRecommendationsReady(event.data);
            }
        };
    }

    /** Envia ao worker a lista usada para reconstruir e treinar o modelo. */
    triggerTrain(users) {
        this.#worker.postMessage({ action: workerEvents.trainModel, users });
    }

    /** Solicita uma recomendação somente após existir um modelo treinado. */
    triggerRecommend(user) {
        this.#worker.postMessage({ action: workerEvents.recommend, user });
    }
}
