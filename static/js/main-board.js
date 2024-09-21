import { Chess } from '/static/js/chess.js'
import { initStockfish, stockfish_eval } from './stockfish-manager.js'

// State variables
var board = null
var game = new Chess()


var $eval = $('#eval')
var move_table = document.getElementById('pgn-table-holder')
var fen = document.getElementById('new-game-fen')

// Initialize Stockfish
const stockfish = await initStockfish($eval);

// Allow 
function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // only pick up pieces for the side to move
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
}

async function onDrop (source, target) {
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
      var c = game.move(
        data.move
      )
  }))
  
  await updateStatus()
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  fen.value = game.fen()
  board.position(game.fen())
}

async function updateStatus () {
  // Draw table in the PGN
  move_table.innerHTML = ""
  move_table.appendChild(tableFromPGN(game.pgn()));

  // Make post request to backend with the PGN or FEN
  await stockfish_eval(stockfish, game.fen())
  fen.value = game.fen()
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

await updateStatus();

// Add functionality to start from given FEN
document.getElementById('start-new-game-button').onclick = async function () {
  game = Chess(fen.value);

  await updateStatus();
}

// Undo Button
document.getElementById('undo-button').onclick = async function () {
  game.undo(); //undo bot move
  game.undo(); //undo our move
  board.position(game.fen())
  await updateStatus();
}

// Reset Button
document.getElementById('reset-button').onclick = async function () {
  game = Chess()
  board.position(game.fen())
  await updateStatus();
}

function tableFromPGN(pgn) {
  const table = document.createElement('table')
  table.classList.add('table')
  table.classList.add('table-striped')

  //Add table head
  const thead = document.createElement('thead')
  const thead_r = document.createElement('tr')
  
  const thead_c1 = document.createElement('th')
  thead_c1.innerText = "#"
  thead_r.appendChild(thead_c1)

  const thead_c2 = document.createElement('th')
  thead_c2.innerText = "move"
  thead_r.appendChild(thead_c2)
  
  thead.appendChild(thead_r)
  table.appendChild(thead)

  //Render all individual moves
  const moves = pgn.split(" ")

  for (let i = 0; i < moves.length; i+=3) {
    var tr = document.createElement('tr')
    var th1 = document.createElement('th') 
    var th2 = document.createElement('th')
    th1.innerText = moves[i]
    th2.innerText = moves[i+1]
    if (i < moves.length-2) {
      th2.innerText += " " + moves[i+2];
    }
     
    tr.appendChild(th1)
    tr.appendChild(th2)
    table.append(tr)
  }
  
  console.log(pgn)

  return table
}