import { events } from "./constants.js";

/**
 * Barramento de eventos da aplicação. Métodos `on...` registram consumidores e
 * métodos `dispatch...` publicam dados, evitando dependência direta entre módulos.
 */
export default class Events {

    /** Observa a conclusão do treinamento. */
    static onTrainingComplete(callback) {
        document.addEventListener(events.trainingComplete, (event) => {
            return callback(event.detail);
        });
    }
    /** Publica a conclusão do treinamento. */
    static dispatchTrainingComplete(data) {
        const event = new CustomEvent(events.trainingComplete, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    /** Observa solicitações de recomendação. */
    static onRecommend(callback) {
        document.addEventListener(events.recommend, (event) => {
            return callback(event.detail);
        });
    }
    /** Publica uma solicitação de recomendação. */
    static dispatchRecommend(data) {
        const event = new CustomEvent(events.recommend, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    /** Observa a lista final de produtos recomendados. */
    static onRecommendationsReady(callback) {
        document.addEventListener(events.recommendationsReady, (event) => {
            return callback(event.detail);
        });
    }
    /** Publica produtos já pontuados e ordenados. */
    static dispatchRecommendationsReady(data) {
        const event = new CustomEvent(events.recommendationsReady, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    /** Observa solicitações de novo treinamento. */
    static onTrainModel(callback) {
        document.addEventListener(events.modelTrain, (event) => {
            return callback(event.detail);
        });
    }
    /** Publica dados para iniciar o treinamento. */
    static dispatchTrainModel(data) {
        const event = new CustomEvent(events.modelTrain, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    /** Observa métricas de cada época para o TFVisor. */
    static onTFVisLogs(callback) {
        document.addEventListener(events.tfvisLogs, (event) => {
            return callback(event.detail);
        });
    }

    /** Publica uma nova métrica do TFVisor. */
    static dispatchTFVisLogs(data) {
        const event = new CustomEvent(events.tfvisLogs, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    /** Observa metadados destinados ao TFVisor. */
    static onTFVisorData(callback) {
        document.addEventListener(events.tfvisData, (event) => {
            return callback(event.detail);
        });
    }
    /** Publica metadados destinados ao TFVisor. */
    static dispatchTFVisorData(data) {
        const event = new CustomEvent(events.tfvisData, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    /** Observa alterações no progresso de treinamento. */
    static onProgressUpdate(callback) {
        document.addEventListener(events.modelProgressUpdate, (event) => {
            return callback(event.detail);
        });
    }

    /** Publica o percentual atual do treinamento. */
    static dispatchProgressUpdate(progressData) {
        const event = new CustomEvent(events.modelProgressUpdate, {
            detail: progressData
        });
        document.dispatchEvent(event);
    }


    /** Observa a seleção de um cliente. */
    static onUserSelected(callback) {
        document.addEventListener(events.userSelected, (event) => {
            return callback(event.detail);
        });
    }
    /** Publica o cliente selecionado. */
    static dispatchUserSelected(data) {
        const event = new CustomEvent(events.userSelected, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    /** Observa mudanças na lista ou nas compras dos clientes. */
    static onUsersUpdated(callback) {
        document.addEventListener(events.usersUpdated, (event) => {
            return callback(event.detail);
        });
    }
    /** Publica a versão atualizada dos clientes. */
    static dispatchUsersUpdated(data) {
        const event = new CustomEvent(events.usersUpdated, {
            detail: data
        });
        document.dispatchEvent(event);
    }


    /** Observa uma nova compra. */
    static onPurchaseAdded(callback) {
        document.addEventListener(events.purchaseAdded, (event) => {
            return callback(event.detail);
        });
    }
    /** Publica uma nova compra. */
    static dispatchPurchaseAdded(data) {
        const event = new CustomEvent(events.purchaseAdded, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    /** Observa a remoção de uma compra. */
    static onPurchaseRemoved(callback) {
        document.addEventListener(events.purchaseRemoved, (event) => {
            return callback(event.detail);
        });
    }

    /** Publica a remoção de uma compra. */
    static dispatchEventPurchaseRemoved(data) {
        const event = new CustomEvent(events.purchaseRemoved, {
            detail: data
        });
        document.dispatchEvent(event);
    }

}
