from flask import Flask, render_template, request
import chess
import random
app = Flask(__name__)

current_game = ""

@app.route('/')
def index():
    return render_template('index.html')

@app.route("/move", methods=['POST'])
def get_bot_move():
    #use the fen str to get a logical chess move
    fen = request.json['fen']
    board = chess.Board(fen)

    move = random.choice(list(board.legal_moves))

    #Make this True when you want to default to Stockfish
    make_best_move = False

    return {'move':board.san(move), 'best_move':make_best_move}

if __name__ == '__main__':
    app.run(debug=True)

