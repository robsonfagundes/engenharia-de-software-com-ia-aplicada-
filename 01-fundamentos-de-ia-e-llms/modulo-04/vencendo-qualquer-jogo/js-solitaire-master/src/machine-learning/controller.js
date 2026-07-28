import { captureGame } from './capture';
import { chooseMove, moveKey, stateKey } from './solver';
import { countVisibleCards, createMetrics } from './metrics';

const STEP_DELAY = 450;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Coordena captura -> predição no worker -> escolha -> clique -> validação.
 */
export function initAutomation({ gameEl, resetGame, getSnapshot }) {
    const button = document.getElementById('js-ai-toggle');
    const status = document.getElementById('js-ai-status');
    const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    const history = new Set();
    const metrics = createMetrics();
    let running = false;
    let busy = false;

    const setStatus = text => { status.textContent = `AI: ${text}`; };

    // Permite consultar as estatísticas pelo console do navegador.
    window.solitaireAIStats = () => {
        metrics.print('estatísticas atuais');
        return metrics.snapshot();
    };
    // Transfere o bitmap ao worker; o segundo argumento evita copiar a imagem.
    const predict = (image, observations) => new Promise(resolve => {
        worker.onmessage = ({ data }) => data.type === 'prediction' && resolve(data);
        worker.postMessage({ type: 'predict', image, observations }, [image]);
    });

    // Converte coordenadas do tabuleiro em um clique real do navegador.
    async function clickAt(x, y) {
        const rect = gameEl.getBoundingClientRect();
        const target = document.elementFromPoint(rect.left + x, rect.top + y);
        target?.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: rect.left + x, clientY: rect.top + y }));
        await wait(STEP_DELAY);
    }

    // Executa a decisão e confirma se o estado do jogo realmente mudou.
    async function execute(move, state) {
        history.add(`${stateKey(state)}|${moveKey(move)}`);
        if (move.type === 'stuck') {
            metrics.data.restarts++;
            setStatus('sem jogadas — nova partida');
            history.clear();
            resetGame();
            await wait(STEP_DELAY);
            return;
        }

        metrics.data.actions++;
        metrics.data[move.type === 'move' ? 'moves' : move.type === 'stock' ? 'stockClicks' : 'recycles']++;
        const before = stateKey(state);
        if (move.type === 'stock' || move.type === 'recycle') {
            const rect = document.getElementById('js-deck-pile').getBoundingClientRect();
            const gameRect = gameEl.getBoundingClientRect();
            await clickAt(rect.left - gameRect.left + rect.width / 2, rect.top - gameRect.top + rect.height / 2);
        } else {
            const { box } = move.card;
            await clickAt((box.x1 + box.x2) / 2, box.y1 + 8);
        }

        const changed = stateKey(getSnapshot()) !== before;
        metrics.data[changed ? 'successfulActions' : 'failedActions']++;
        if (metrics.data.actions % 10 === 0) metrics.print('relatório periódico');
    }

    // Executa uma iteração; a próxima só começa depois que esta terminar.
    async function step() {
        if (!running || busy) return;
        busy = true;
        try {
            setStatus('capturando');
            const observations = getSnapshot();
            const captureStarted = performance.now();
            const bitmap = await captureGame(gameEl);
            metrics.data.captures++;
            metrics.data.captureTimeMs += performance.now() - captureStarted;
            setStatus('detectando');
            const inferenceStarted = performance.now();
            const prediction = await predict(bitmap, observations);
            metrics.data.inferences++;
            metrics.data.inferenceTimeMs += performance.now() - inferenceStarted;
            metrics.data.detector = prediction.detector;
            const detected = prediction.observations;
            metrics.data.detectedCards += countVisibleCards(detected);
            const foundationCount = detected.foundations.reduce((sum, pile) => sum + pile.length, 0);
            if (foundationCount === 52) {
                running = false;
                button.textContent = 'Start AI';
                setStatus('venceu');
                metrics.data.wins++;
                metrics.print('vitória');
                return;
            }
            const move = chooseMove(detected, history);
            setStatus(`${move.type} (${foundationCount}/52)`);
            await execute(move, detected);
        } catch (error) {
            running = false;
            button.textContent = 'Start AI';
            setStatus(`error: ${error.message}`);
            console.error(error);
        } finally {
            busy = false;
            if (running) requestAnimationFrame(step);
        }
    }

    button.addEventListener('click', () => {
        running = !running;
        button.textContent = running ? 'Stop AI' : 'Start AI';
        setStatus(running ? 'iniciando' : 'parada');
        if (!running) metrics.print('IA parada');
        if (running) step();
    });
}
