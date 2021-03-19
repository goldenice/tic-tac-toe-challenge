//Thijmen was here
const fs = require('fs');
const Arpad = require('arpad');
const elo = new Arpad();
const rankings = JSON.parse(fs.readFileSync('rankings.json', 'utf-8') || '{}');
const gamesPlayed = JSON.parse(fs.readFileSync('games.json', 'utf-8') || '[]');

const lobby = {};

function persist() {
	fs.writeFileSync('rankings.json', JSON.stringify(rankings));
	fs.writeFileSync('games.json', JSON.stringify(gamesPlayed));
}

let gameListeners = [];

module.exports = function createMatchMaking(createMatch) {
	return {
		matchMake: () => {
			const users = Object.keys(lobby);

			// We can't matchmake with fewer than 2 users in lobby
			if (users.length < 2) return;

			// Determine the two users to play
			const firstUser = users[Math.floor(Math.random() * users.length)];
			const remainingUsers = users.filter(x => x != firstUser);
			const secondUser = remainingUsers[Math.floor(Math.random() * remainingUsers.length)];

			console.log('Starting game between', firstUser, 'and', secondUser);

			// Save lobby objects for reinstating after game
			const firstUserLobby = lobby[firstUser];
			const secondUserLobby = lobby[secondUser];

			// Delete users from lobby for duration of match (only one simulatenous game)
			delete lobby[firstUser];
			delete lobby[secondUser];

			firstUserLobby.socket.emit('start');
			secondUserLobby.socket.emit('start');

			// Spin up game engine
			createMatch(firstUser, firstUserLobby.socket, secondUser, secondUserLobby.socket, output => {
				// Get current ELO scores for both players
				const fRanking = rankings[firstUser] || 1000;
				const sRanking = rankings[secondUser] || 1000;

				// Put game in played list
				const game = { ...output, firstUser, secondUser }
				gamesPlayed.push(game);

				// Update rankings
				if (output.outcome == 'WIN') {
					if (output.winPlayer == firstUser) {
						// Update ELO scores with fUser as winner
						rankings[firstUser] = elo.newRatingIfWon(fRanking, sRanking);
						rankings[secondUser] = elo.newRatingIfLost(sRanking, fRanking);
					} else if (output.winPlayer == secondUser) {
						// Update ELO scores with sUser as winner
						rankings[firstUser] = elo.newRatingIfLost(fRanking, sRanking);
						rankings[secondUser] = elo.newRatingIfWon(sRanking, fRanking);
					}
				}

				// Notify listeners of played game
				gameListeners.forEach(fn => fn(game));

				// Save updates to disk
				persist();
			});
		},

		reportReady: (username, socket) => {
			lobby[username] = { socket };
			console.log(Object.keys(lobby).length + ' users in the lobby');
		},

		reportOffline: (username) => {
			delete lobby[username];
		},

		getRankings: () => {
			return rankings;
		},

		getGamesPlayed: () => {
			return gamesPlayed;
		},

		listenToGames: listener => {
			gameListeners.push(listener);
		},

		unlistenToGames: listener => {
			gameListeners = gameListeners.filter(l => l != listener);
		},
	};
};
