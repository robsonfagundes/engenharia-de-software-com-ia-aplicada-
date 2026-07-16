import { View } from './View.js';

/** Mantém e desenha as séries históricas exibidas pelo TensorFlow Visor. */
export class TFVisorView extends View {
    #weights = null;
    #catalog = [];
    #users = [];
    #logs = [];
    #lossPoints = [];
    #accPoints = [];
    #showVisorButton = null;
    /** Abre o painel lateral de métricas ao criar a view. */
    constructor() {
        super();

        const visor = tfvis.visor();
        this.#showVisorButton = document.querySelector('#showTfVisorBtn');

        visor.open();
        this.#syncShowButton();

        this.#showVisorButton?.addEventListener('click', () => {
            visor.open();
            this.#syncShowButton();
        });

        // O Visor controla internamente o botão "Hide" e o atalho de teclado.
        // Sincroniza o nosso botão logo depois de qualquer uma dessas ações.
        document.addEventListener('click', () => {
            requestAnimationFrame(() => this.#syncShowButton());
        });
        document.addEventListener('keydown', () => {
            requestAnimationFrame(() => this.#syncShowButton());
        });
    }

    #syncShowButton() {
        if (this.#showVisorButton) {
            this.#showVisorButton.hidden = tfvis.visor().isOpen();
        }
    }

    /** Armazena metadados adicionais caso o worker os publique. */
    renderData(data) {

        this.#weights = data.weights;
        this.#catalog = data.catalog;
        this.#users = data.users;
    }
    /** Limpa séries antigas antes de um novo treinamento. */
    resetDashboard() {
        this.#weights = null;
        this.#catalog = [];
        this.#users = [];
        this.#logs = [];
        this.#lossPoints = [];
        this.#accPoints = [];
    }

    /** Acrescenta loss/accuracy da época e redesenha os dois gráficos. */
    handleTrainingLog(log) {
        const { epoch, loss, accuracy } = log;
        this.#lossPoints.push({ x: epoch, y: loss });
        this.#accPoints.push({ x: epoch, y: accuracy });
        this.#logs.push(log);

        tfvis.render.linechart(
            {
                name: 'Precisão do Modelo',
                tab: 'Treinamento',
                style: { display: 'inline-block', width: '49%' }
            },
            { values: this.#accPoints, series: ['precisão'] },
            {
                xLabel: 'Época (Ciclos de Treinamento)',
                yLabel: 'Precisão (%)',
                height: 300
            }
        );

        tfvis.render.linechart(
            {
                name: 'Erro de Treinamento',
                tab: 'Treinamento',
                style: { display: 'inline-block', width: '49%' }
            },
            { values: this.#lossPoints, series: ['erros'] },
            {
                xLabel: 'Época (Ciclos de Treinamento)',
                yLabel: 'Valor do Erro',
                height: 300
            }
        );

    }




}
