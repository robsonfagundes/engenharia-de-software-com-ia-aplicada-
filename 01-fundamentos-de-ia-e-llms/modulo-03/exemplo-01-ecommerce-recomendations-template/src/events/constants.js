// Eventos de alto nível trocados entre controllers e views no documento HTML.
export const events = {
    userSelected: 'user:selected',
    usersUpdated: 'users:updated',
    purchaseAdded: 'purchase:added',
    purchaseRemoved: 'purchase:remove',
    modelTrain: 'training:train',
    trainingComplete: 'training:complete',

    modelProgressUpdate: 'model:progress-update',
    recommendationsReady: 'recommendations:ready',
    recommend: 'recommend',
    tfvisData: 'tfvis:data',
    tfvisLogs: 'tfvis:logs',
}

// Mensagens trocadas exclusivamente entre a thread principal e o Web Worker.
export const workerEvents = {
    trainingComplete: 'training:complete',
    trainModel: 'train:model',
    recommend: 'recommend',
    trainingLog: 'training:log',
    progressUpdate: 'progress:update',
    tfVisData: 'tfvis:data',
    tfVisLogs: 'tfvis:logs',
}
