// Load stockfish

export async function initStockfish(evalText) {
    const stockfish = new Worker("/static/js/stockfish-16.1-lite-single.js");
    console.log('loading stockfish')

    stockfish.postMessage('uci')    
    await ensureEngineReady(stockfish);
    
    stockfish.onmessage = eval_msg_handler

    return stockfish
}

function eval_msg_handler(e) {
    // console.log(e.data)
    //We need to ensure that the engine is ready
    const scoreMatch = e.data.match(/score (cp|mate) (-?\d+)/);
    if (scoreMatch) {
        const scoreValue = scoreMatch[2];
        // console.log(scoreValue)
    }
}
export async function stockfish_eval(stockfish, fen) {
    // console.log(`Anaylsing ${fen}`)
    stockfish.postMessage('ucinewgame');  // Start a new game
    await ensureEngineReady(stockfish);
    stockfish.postMessage(`position fen ${fen}`);  // Set the position
    await ensureEngineReady(stockfish);
    stockfish.postMessage('go depth 15');  // Analyze to a depth of 10
}

function ensureEngineReady(stockfish) {
    return new Promise((resolve) => {
        stockfish.onmessage = function(event) {
            if (event.data === 'readyok') {
                // console.log(event)
                stockfish.onmessage = eval_msg_handler
                resolve();
            }
        };
        stockfish.postMessage('isready')
    });
}
