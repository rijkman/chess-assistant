import { Chess } from '/static/js/chess.js'
const stockfish = new Worker("/static/js/stockfish-16.1-lite-single.js");
stockfish.postMessage('uci')
console.log('loading stockfish')
var board = null
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')
var $eval = $('#eval')

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // only pick up pieces for the side to move
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
}

function onDrop (source, target) {
  console.log(source, target)
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })

  // illegal move
  if (move === null) return 'snapback'

  // legal move so we can ask the backend for a move
  fetch('/move', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fen:game.fen() })
  }
  ).then(
    (response => response.json())
  ).then((data => {
      game = new Chess(data.fen)
      console.log(game.fen())
  }))
  
  updateStatus()
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen())
}

function updateStatus () {
  var status = ''

  var moveColor = 'White'
  if (game.turn() === 'b') {
    moveColor = 'Black'
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.'
  }

  // draw?
  else if (game.in_draw()) {
    status = 'Game over, drawn position'
  }

  // game still on
  else {
    status = moveColor + ' to move'

    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' is in check'
    }
  }

  $status.html(status)
  $fen.html(game.fen())
  $pgn.html(game.pgn())
  // Make post request to backend with the PGN or FEN
  sendMoveToStockfish(game.fen());
}


stockfish.onmessage = function(e) {
    const scoreMatch = e.data.match(/score (cp|mate) (-?\d+)/);
    if (scoreMatch) {
      const scoreValue = parseInt(scoreMatch[2]);
      $eval.html(scoreValue)
    }
};

function sendMoveToStockfish(fen) {
    stockfish.postMessage('ucinewgame');  // Start a new game
    stockfish.postMessage(`position fen ${fen}`);  // Set the position
    stockfish.postMessage('go depth 10');  // Analyze to a depth of 10
}

var config = {
  pieceTheme: '/static/img/chesspieces/wikipedia/{piece}.png',
  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
}
board = Chessboard('myBoard', config)

updateStatus()