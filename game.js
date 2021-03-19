const DEFAULT_BOARD = [
    0, 0, 0,
    0, 0, 0,
    0, 0, 0,
];

// Checks if the transition from boardA -> boardB is a valid move
function isValidMove(boardA, boardB) {
    return boardA.reduce((valid, field, idx) => valid && (boardB[idx] == field || field == 0), true)
        && boardA.filter(f => f != 0).length + 1 === boardB.filter(f => f != 0).length;
}

// Check for done condition
function checkDone(board) {
  if (board[0] !== 0 && board[0] === board[1] && board[1] === board[2]) {
    return { done: true, winPlayer: board[0] };
  } else if (board[3] !== 0 && board[3] === board[4] && board[4] === board[5]) {
    return { done: true, winPlayer: board[3] };
  } else if (board[6] !== 0 && board[6] === board[7] && board[7] === board[8]) {
    return { done: true, winPlayer: board[6] };
  } else if (board[0] !== 0 && board[0] === board[3] && board[3] === board[6]) {
    return { done: true, winPlayer: board[0] };
  } else if (board[1] !== 0 && board[1] === board[4] && board[4] === board[7]) {
    return { done: true, winPlayer: board[1] };
  } else if (board[2] !== 0 && board[2] === board[5] && board[5] === board[8]) {
    return { done: true, winPlayer: board[2] };
  } else if (board[0] !== 0 && board[0] === board[4] && board[4] === board[8]) {
    return { done: true, winPlayer: board[0] };
  } else if (board[2] !== 0 && board[2] === board[4] && board[4] === board[6]) {
    return { done: true, winPlayer: board[2] };
  } else if (board.filter(f => f === 0).length === 0) { // draw
    return { done: true, winPlayer: 0 };
  } else {
    return { done: false };
  }
}

module.exports = function startGame(p1, s1, p2, s2, onDone) {
    const gameId = Math.floor(Math.random() * 65535);
    let turn = 'p1';
    let board = [ ...DEFAULT_BOARD ];
    let cancelled = false;
    let timeout = null;

    function cancelGame() {
        if (timeout) clearTimeout(timeout);
        cancelled = true;
        s1.emit('reset');
        s2.emit('reset');
    }

    function onMoveReceived(newBoard, gId) {
        if (gId != gameId) return; // should never happen, but after server restart there might be unsent messages which socket.io retries
        if (cancelled) return; // ignore further moves if game was cancelled due to timeout or so
        if (timeout) clearTimeout(timeout);

        const currentTurnPlayer = (turn == 'p1' ? p1 : p2);
        const otherPlayer = (turn == 'p2' ? p1 : p2);

        // Make sure we aren't receiving illegal input
        if (!Array.isArray(newBoard) || newBoard.length != 9) {
            cancelGame();
            return onDone({ outcome: 'CANCELLED', description: 'Illegal input by player '+ currentTurnPlayer });
        }

        // Validate this is a valid move
        if (!isValidMove(board, newBoard)) {
            console.log('Illegal move by player ' + currentTurnPlayer, board, newBoard);
            cancelGame();
            return onDone({ outcome: 'CANCELLED', description: 'Illegal move by player ' + currentTurnPlayer });
        }

        // Check win or draw conditions
        const doneState = checkDone(newBoard);
        if (doneState.done && doneState.winPlayer != 0) {
            s1.emit(currentTurnPlayer == 'p1' ? 'win' : 'lose');
            s2.emit(currentTurnPlayer == 'p1' ? 'lose' : 'win');
            s1.emit('reset');
            s2.emit('reset');
            return onDone({ outcome: 'WIN', description: 'Win by player ' + currentTurnPlayer + ' over ' + otherPlayer, winPlayer: currentTurnPlayer });
        } else if (doneState.done && doneState.winPlayer == 0) {
            s1.emit('draw');
            s2.emit('draw');
            s1.emit('reset');
            s2.emit('reset');
            return onDone({ outcome: 'DRAW', description: 'Draw between ' + currentTurnPlayer + ' and ' + otherPlayer });
        }

        // Apply move, prepare everything for next turn
        board = newBoard;
        turn = turn == 'p1' ? 'p2' : 'p1';
        doNextTurn();
    }

    function doNextTurn() {
        const currentTurnPlayer = (turn == 'p1' ? p1 : p2);

        if (turn == 'p1') {
            s1.once('move', onMoveReceived);
            s1.emit('turn', board, gameId);
        } else {
            s2.once('move', (b, gid) => onMoveReceived(b.map(b => b * -1), gid));
            s2.emit('turn', board.map(b => b * -1), gameId);
        }
        timeout = setTimeout(() => {
            cancelGame();
            return onDone({ outcome: 'CANCELLED', description: 'Timeout of ' + currentTurnPlayer });
        }, 5000);
    }

    doNextTurn();
}
