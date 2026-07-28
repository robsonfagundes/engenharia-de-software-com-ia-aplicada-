const oppositeColor = (a, b) => a.color !== b.color;
const top = cards => cards[cards.length - 1];

// Procura um destino válido seguindo as regras da Paciência Klondike.
function destinationFor(card, state, canMoveToFoundation = true) {
    if (canMoveToFoundation && card.rank === 1) {
        const empty = state.foundations.findIndex(pile => pile.length === 0);
        if (empty >= 0) return { area: 'foundation', pile: empty };
    } else if (canMoveToFoundation) {
        const foundation = state.foundations.findIndex(pile => {
            const parent = top(pile);
            return parent && parent.suit === card.suit && parent.rank + 1 === card.rank;
        });
        if (foundation >= 0) return { area: 'foundation', pile: foundation };
    }

    const tableau = state.tableau.findIndex(pile => {
        const parent = top(pile);
        return parent
            ? parent.facingUp && parent.rank === card.rank + 1 && oppositeColor(parent, card)
            : card.rank === 13;
    });
    return tableau >= 0 ? { area: 'tableau', pile: tableau } : null;
}

function wouldReveal(pile, index) {
    // Prioriza jogadas que revelam uma carta virada para baixo.
    return index > 0 && !pile[index - 1].facingUp;
}

/**
 * Gera e pontua as jogadas possíveis para escolher a que produz mais progresso.
 */
export function chooseMove(state, history) {
    const candidates = [];

    state.tableau.forEach((pile, pileIndex) => {
        pile.forEach((card, cardIndex) => {
            if (!card.facingUp) return;
            const destination = destinationFor(card, state, cardIndex === pile.length - 1);
            if (!destination || (destination.area === 'tableau' && destination.pile === pileIndex)) return;
            let score = destination.area === 'foundation' ? 30 : 20;
            if (wouldReveal(pile, cardIndex)) score += 100;
            if (cardIndex === 0 && pile.length === 1) score += 70;
            candidates.push({ type: 'move', card, destination, score });
        });
    });

    const waste = top(state.waste);
    if (waste) {
        const destination = destinationFor(waste, state);
        if (destination) candidates.push({ type: 'move', card: waste, destination, score: 45 });
    }

    // Ordena da jogada mais vantajosa para a menos vantajosa.
    candidates.sort((a, b) => b.score - a.score);
    const signature = stateKey(state);
    const selected = candidates.find(move => !history.has(`${signature}|${moveKey(move)}`));
    if (selected) return selected;
    if (state.stockCount > 0 && !history.has(`${signature}|stock`)) return { type: 'stock' };
    if (state.waste.length > 0 && !history.has(`${signature}|recycle`)) return { type: 'recycle' };
    return { type: 'stuck' };
}

export function moveKey(move) {
    // Identificador usado para não repetir a mesma ação no mesmo estado.
    if (move.type !== 'move') return move.type;
    return `${move.card.suit}${move.card.rank}:${move.destination.area}${move.destination.pile}`;
}

export function stateKey(state) {
    // Resume todo o tabuleiro em uma string para detectar ciclos.
    const card = item => item ? `${item.suit}${item.rank}${item.facingUp ? 'u' : 'd'}` : '-';
    const piles = state.tableau.map(pile => pile.map(card).join('.')).join('/');
    const foundations = state.foundations.map(pile => card(top(pile))).join('/');
    return `${state.stockCount}|${card(top(state.waste))}|${foundations}|${piles}`;
}
