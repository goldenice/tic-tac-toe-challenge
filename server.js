const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const servestatic = require('serve-static');

const startGame = require('./game.js');
const createMatchMaking = require('./matchmaking.js');
const matchMaking = createMatchMaking(startGame);

app.use(servestatic('frontend'));

io.on('connection', socket => {
	let username = null;

	function gameListener(game) {
		socket.emit('game', game);
	}

	socket.on('register', uname => {
		username = uname;
		matchMaking.reportReady(username, socket);
	});

	socket.on('rankings', () => {
		socket.emit('rankings', matchMaking.getRankings());
	});

	socket.on('games', () => {
		socket.emit('games', matchMaking.getGamesPlayed().slice(-1000));
	});

	socket.on('games-subscribe', () => {
		matchMaking.listenToGames(gameListener);
	});

	socket.on('disconnect', () => {
		matchMaking.unlistenToGames(gameListener);
		matchMaking.reportOffline(username);
	});
});

setInterval(() => matchMaking.matchMake(), 3000);

http.listen(1337, () => {
	console.log('Tic-tac-toe server listening on 1337');
});
