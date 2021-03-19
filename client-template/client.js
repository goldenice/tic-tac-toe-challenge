// ----------- YOUR CODE -----------
const USERNAME = '';

// This is what you need to update
//Generate random move
function myAImove(board) {
  //Check for empty fields
  const options = board.map((f, idx) => f == 0 ? idx : null).filter(x => x != null);
  //Return random move
  return doMove(board, options[Math.floor(Math.random() * options.length)], -1);
}


// Returns an updated board with the field filled out
function doMove(board, fieldIdx, value) {
  return board.map((v, idx) => idx === fieldIdx ? value : v);
}



// ----------- DO NOT EDIT BELOW THIS LINE -----------

const username = process.argv[2] || USERNAME;
if (username == null || username.length == 0) throw new Error("Cannot start Tic-Tac-Toe client without username!");

const io = require('socket.io-client');
const socket = io('http://localhost:1337');

console.log('Using username ' + username);
console.log('Connecting...');
socket.on('connect', () => {
    console.log('Connected to server!');

    socket.on('start', () => console.log('Game starting...'));
    socket.on('win', () => console.log('We won! :)'));
    socket.on('lose', () => console.log('We lost :('));
    socket.on('draw', () => console.log('Draw! :|'));
    socket.on('reset', () => {
        socket.emit('register', username); // reregister for new matchmaking
    });

    socket.on('disconnect', () => {
        console.log('Server disconnected');
    });

    socket.emit('register', username);
    socket.on('turn', (board, gameId) => {
        console.log('Server requested turn');
        socket.emit('move', myAImove(board), gameId);
    });
});
