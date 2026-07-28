export function createMetrics() {
    const startedAt = performance.now();
    // Contadores acumulados durante toda a sessão da página.
    const data = {
        captures: 0,
        inferences: 0,
        detectedCards: 0,
        actions: 0,
        successfulActions: 0,
        failedActions: 0,
        moves: 0,
        stockClicks: 0,
        recycles: 0,
        restarts: 0,
        wins: 0,
        captureTimeMs: 0,
        inferenceTimeMs: 0,
        detector: 'development-fallback'
    };

    // Calcula indicadores derivados sem modificar os contadores originais.
    const snapshot = () => {
        const accuracy = data.actions
            ? (data.successfulActions / data.actions) * 100
            : 0;
        return {
            ...data,
            actionAccuracy: `${accuracy.toFixed(2)}%`,
            averageCaptureMs: data.captures
                ? (data.captureTimeMs / data.captures).toFixed(2)
                : '0.00',
            averageInferenceMs: data.inferences
                ? (data.inferenceTimeMs / data.inferences).toFixed(2)
                : '0.00',
            elapsedSeconds: ((performance.now() - startedAt) / 1000).toFixed(2),
            modelAccuracy: data.detector === 'yolo'
                ? 'requer um conjunto de validação rotulado'
                : 'N/D — fallback determinístico'
        };
    };

    // console.table facilita a leitura durante a demonstração.
    const print = label => {
        console.group(`🧠 Solitaire AI — ${label}`);
        console.table(snapshot());
        console.groupEnd();
    };

    return { data, snapshot, print };
}

export function countVisibleCards(state) {
    // Nas fundações, somente a carta do topo fica visualmente exposta.
    const tableau = state.tableau.reduce(
        (total, pile) => total + pile.filter(card => card.facingUp).length,
        0
    );
    const foundations = state.foundations.filter(pile => pile.length > 0).length;
    return tableau + foundations + state.waste.length + (state.stockCount > 0 ? 1 : 0);
}
