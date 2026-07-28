# Automação do Solitaire inspirada no exemplo Duck Hunt com YOLO

## 1. Objetivo do exercício

O objetivo foi reproduzir, no jogo Solitaire, o mesmo fluxo didático apresentado
no Duck Hunt:

```text
Captura da tela
    ↓
Processamento fora da thread principal
    ↓
Conversão das observações em coordenadas
    ↓
Escolha de uma ação
    ↓
Clique automatizado
    ↓
Nova captura para confirmar o resultado
```

No Duck Hunt, detectar um objeto é suficiente para clicar nele. No Solitaire,
existe uma dificuldade adicional: depois de encontrar as cartas, é necessário
entender as pilhas, aplicar as regras do jogo e escolher uma jogada válida.

## 2. Escopo que foi implementado

Esta implementação é um exemplo simples feito somente com JavaScript no
navegador. Ela reproduz a arquitetura usada em uma aplicação com YOLO, mas não
treina nem carrega um modelo de cartas.

O Web Worker recebe um `ImageBitmap`, processa a imagem fora da thread principal
e devolve as observações. Como ainda não existe um YOLO treinado para as 52
cartas, os valores, naipes e caixas delimitadoras são obtidos do próprio estado
do jogo por meio de um fallback determinístico.

Portanto:

- a captura visual com `createImageBitmap` é real;
- a transferência da imagem para o Web Worker é real;
- o processamento fora da thread principal é real;
- as coordenadas e ações automáticas são reais;
- o solver de Paciência é real;
- a classificação das cartas por YOLO é simulada pelo fallback JavaScript.

Essa separação permite explicar o fluxo de Web Machine Learning sem adicionar
treinamento, Python, ONNX ou infraestrutura fora do escopo.

## 3. Comparação entre o plano e o resultado

| Etapa planejada | Como ficou implementada |
| --- | --- |
| Capturar a tela | O HTML do jogo é rasterizado com `html2canvas` |
| Criar o bitmap | O canvas é convertido com `createImageBitmap` |
| Enviar ao worker | O bitmap é transferido com `postMessage` e transfer list |
| Processar com YOLO | O worker preserva essa fronteira, usando fallback didático no lugar do modelo |
| Obter coordenadas | Cada carta recebe uma caixa `{x1, y1, x2, y2}` relativa ao tabuleiro |
| Reconstruir o estado | O snapshot contém estoque, descarte, quatro fundações e sete colunas |
| Escolher a jogada | O solver gera movimentos válidos e aplica pontuações |
| Gerar a ação | Um `MouseEvent` é disparado na coordenada escolhida |
| Confirmar a ação | O estado antes e depois do clique é comparado |
| Evitar ciclos | Cada combinação de estado e ação fica registrada no histórico |
| Medir o resultado | Capturas, ações, tempos e acurácia das ações são exibidos no console |

## 4. Captura da tela

O Solitaire é construído com elementos HTML. Diferentemente do Duck Hunt, não
existe um canvas principal que possa ser extraído diretamente. Por isso foi
adicionada a dependência `html2canvas`.

O arquivo `src/machine-learning/capture.js` executa duas operações:

```js
const canvas = await html2canvas(gameEl, {
    backgroundColor: null,
    logging: false,
    scale: 1
});

return createImageBitmap(canvas);
```

Primeiro, o elemento `#js-solitaire` é desenhado em um canvas. Depois, esse
canvas é transformado em `ImageBitmap`, formato apropriado para transferência ao
Web Worker.

## 5. Representação visual das cartas

Foi criada a função `createAutomationSnapshot()` em `src/index.js`. Ela converte
o estado interno do jogo em uma representação semelhante à saída de um detector
de objetos.

Cada carta é descrita com:

```js
{
    id,
    rank,
    suit,
    color,
    facingUp,
    box: {
        x1,
        y1,
        x2,
        y2
    }
}
```

As coordenadas são calculadas com `getBoundingClientRect()` e convertidas para o
sistema local do tabuleiro:

```js
x1: cardRect.left - gameRect.left
y1: cardRect.top - gameRect.top
x2: cardRect.right - gameRect.left
y2: cardRect.bottom - gameRect.top
```

O snapshot completo contém:

```js
{
    stockCount,
    waste,
    foundations: [[], [], [], []],
    tableau: [[], [], [], [], [], [], []]
}
```

Assim, o restante da automação não precisa acessar diretamente todas as funções
internas do jogo.

## 6. Processamento no Web Worker

O arquivo `src/machine-learning/worker.js` representa a etapa de inferência.
O controller envia uma mensagem com este formato:

```js
worker.postMessage({
    type: 'predict',
    image,
    observations
}, [image]);
```

O array `[image]` transforma o bitmap em um objeto transferível. Dessa forma, o
navegador transfere sua propriedade ao worker sem duplicar todos os pixels na
memória.

No worker, a imagem é desenhada em um `OffscreenCanvas`:

```js
const canvas = new OffscreenCanvas(image.width, image.height);
canvas.getContext('2d').drawImage(image, 0, 0);
```

Depois do processamento, `image.close()` libera o recurso e o worker devolve uma
mensagem do tipo `prediction`.

O campo `detector: 'development-fallback'` deixa explícito que, nesta versão, as
observações não vieram de um modelo treinado.

## 7. Conversão das coordenadas em cliques

O controller recebe caixas delimitadoras relativas ao jogo. Para clicar em uma
carta, ele calcula:

```js
const x = (box.x1 + box.x2) / 2;
const y = box.y1 + 8;
```

O eixo horizontal usa o centro da carta. No eixo vertical, o clique acontece
oito pixels abaixo do topo. Isso é importante porque as cartas das colunas ficam
parcialmente cobertas; clicar no centro poderia atingir outra carta.

A posição local é convertida para o viewport:

```js
const rect = gameEl.getBoundingClientRect();
const target = document.elementFromPoint(rect.left + x, rect.top + y);
```

Finalmente, a ação é produzida com JavaScript:

```js
target.dispatchEvent(new MouseEvent('click', {
    bubbles: true,
    clientX: rect.left + x,
    clientY: rect.top + y
}));
```

Foi escolhido o clique, e não o drag-and-drop, porque o Solitaire já possui uma
regra em `handleClick`: ao clicar em uma carta válida, o próprio jogo encontra o
primeiro destino disponível. Isso reduziu a complexidade da demonstração.

## 8. Estratégia usada pelo solver

O arquivo `src/machine-learning/solver.js` contém as regras de decisão.

### 8.1 Regras respeitadas

- ases podem iniciar uma fundação vazia;
- uma fundação cresce em ordem e mantém o mesmo naipe;
- nas colunas, as cartas ficam em ordem decrescente e com cores alternadas;
- uma coluna vazia aceita somente um rei;
- somente uma carta sem outras cartas abaixo dela pode ir para a fundação;
- cartas do descarte também podem originar uma jogada.

### 8.2 Pontuação das ações

O solver gera os movimentos possíveis e atribui prioridades:

| Situação | Pontuação |
| --- | ---: |
| Revelar uma carta fechada | +100 |
| Esvaziar uma coluna com uma única carta | +70 |
| Usar uma carta do descarte | +45 |
| Enviar uma carta à fundação | +30 |
| Organizar uma sequência no tableau | +20 |

As ações são ordenadas pela pontuação e a primeira ação ainda não executada no
estado atual é selecionada.

### 8.3 Estoque, reciclagem e nova partida

Quando não existe movimento de carta:

1. a IA compra uma carta se ainda existir estoque;
2. recicla o descarte quando o estoque termina;
3. inicia uma nova partida se não houver mais progresso possível.

Esse último caso é necessário porque o embaralhamento aleatório pode produzir
uma partida sem solução ou um estado que a heurística simples não consegue
resolver.

## 9. Prevenção de ciclos

O solver cria uma assinatura do tabuleiro com `stateKey()` contendo:

- quantidade de cartas no estoque;
- carta visível no descarte;
- carta superior de cada fundação;
- conteúdo e orientação das cartas nas sete colunas.

A assinatura do estado é combinada com a ação:

```text
estado atual | carta | tipo de destino | pilha de destino
```

O conjunto `history` impede que a mesma ação seja repetida indefinidamente no
mesmo estado. A mesma carta pode voltar a ser usada mais tarde caso o estado do
tabuleiro tenha mudado.

## 10. Ciclo de execução da IA

O arquivo `src/machine-learning/controller.js` centraliza a automação:

```text
1. Verifica se a IA está ativa e livre
2. Obtém o snapshot do jogo
3. Captura o tabuleiro
4. Cria o ImageBitmap
5. Envia bitmap e observações ao worker
6. Recebe a predição
7. Conta as cartas nas fundações
8. Solicita uma jogada ao solver
9. Converte a caixa da carta em coordenadas
10. Dispara o clique
11. Aguarda 450 ms
12. Confirma se o estado mudou
13. Inicia a próxima iteração
```

As variáveis `running` e `busy` evitam inferências sobrepostas. A próxima
captura é iniciada apenas depois que a ação anterior foi finalizada.

## 11. Interface adicionada

Em `src/index.html` foram adicionados:

```html
<button id="js-ai-toggle">Start AI</button>
<span id="js-ai-status">AI: stopped</span>
```

O botão alterna entre iniciar e parar a IA. O texto de status informa etapas como
captura, detecção, movimentação, vitória ou reinício da partida.

Em `src/index.scss` foram adicionados estilos simples para separar o botão e
posicionar o status à direita.

## 12. Estatísticas e acurácia

O arquivo `src/machine-learning/metrics.js` coleta:

- quantidade de capturas;
- quantidade de inferências;
- cartas visíveis processadas;
- ações tentadas;
- ações que alteraram o tabuleiro;
- ações sem efeito;
- movimentações de cartas;
- cliques no estoque;
- reciclagens do descarte;
- partidas reiniciadas;
- vitórias;
- tempo total e tempos médios.

A acurácia apresentada é a acurácia das ações:

```text
actionAccuracy = ações que mudaram o estado / ações tentadas × 100
```

Ela não representa a acurácia de um modelo YOLO. Como a versão atual utiliza o
fallback determinístico, `modelAccuracy` aparece como não disponível.

O relatório é exibido automaticamente a cada dez ações, quando a IA é parada e
quando vence. Também pode ser solicitado no console:

```js
solitaireAIStats()
```

## 13. Arquivos alterados e criados

| Arquivo | Responsabilidade |
| --- | --- |
| `package.json` | Adiciona `html2canvas` |
| `yarn.lock` | Registra a nova dependência |
| `src/index.html` | Adiciona botão e status da IA |
| `src/index.scss` | Estiliza os novos controles |
| `src/index.js` | Inicializa a automação e produz o snapshot |
| `src/machine-learning/capture.js` | Captura o HTML e cria o bitmap |
| `src/machine-learning/worker.js` | Processa o bitmap fora da thread principal |
| `src/machine-learning/controller.js` | Controla todo o ciclo automático |
| `src/machine-learning/solver.js` | Aplica regras e escolhe jogadas |
| `src/machine-learning/metrics.js` | Calcula estatísticas e acurácia das ações |
| `README.md` | Explica como iniciar e consultar as métricas |

## 14. Como executar e demonstrar

```bash
yarn
yarn start
```

Acesse `http://localhost:3000`, abra o console do navegador e clique em
**Start AI**.

Durante a apresentação, a explicação pode seguir esta ordem:

1. mostrar que o Solitaire é HTML e precisa ser rasterizado;
2. mostrar `capture.js` e o uso de `createImageBitmap`;
3. mostrar a transferência da imagem para `worker.js`;
4. explicar o fallback que representa a saída de um detector;
5. mostrar as caixas delimitadoras produzidas no snapshot;
6. explicar as regras e pontuações do solver;
7. mostrar a conversão da caixa em coordenada de clique;
8. iniciar a IA e acompanhar o status;
9. executar `solitaireAIStats()` no console;
10. reforçar que o código está preparado como demonstração do fluxo, não como
    um modelo YOLO de cartas treinado.

<!-- ## 15. Resumo para apresentação oral

> Adaptamos para o Solitaire a mesma sequência usada no exemplo do Duck Hunt:
> capturamos a tela, criamos um ImageBitmap, enviamos a imagem para um Web Worker,
> transformamos as observações em coordenadas e geramos cliques automáticos. A
> diferença é que, no Solitaire, também precisamos reconstruir as pilhas e aplicar
> as regras do jogo. Criamos um solver que prioriza revelar cartas, liberar
> colunas, usar o descarte e alimentar as fundações. Depois de cada clique, uma
> nova captura confirma se o estado mudou. Para manter o exercício somente em
> JavaScript e dentro do escopo, usamos um fallback determinístico para representar
> as detecções, sem treinar um modelo de cartas. Também adicionamos métricas para
> medir ações bem-sucedidas, tempo de captura e tempo de processamento. -->

## 15. Limitações conhecidas

- não existe um modelo YOLO treinado para reconhecer as cartas;
- o fallback conhece o estado interno do jogo;
- a estratégia é heurística e não faz busca completa de todas as soluções;
- o clique utiliza o primeiro destino escolhido pelo próprio jogo;
- algumas distribuições podem ser insolúveis;
- `actionAccuracy` mede sucesso das ações, não acurácia de visão computacional.

Essas limitações são intencionais para manter o exemplo pequeno, explicável e
totalmente executável em JavaScript no navegador.
