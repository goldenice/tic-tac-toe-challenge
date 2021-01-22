const socket = io();

socket.on('connect', () => {
    socket.emit('rankings');
    socket.emit('games-subscribe');
    socket.emit('games');
});

socket.on('rankings', (rankings) => {
    const newTableBody = Object.keys(rankings)
        .map(username => ({ username, ranking: rankings[username] }))
        .sort((a,b) => b.ranking - a.ranking)
        .map((r, idx) => '<tr><td>#' + (idx + 1) + '</td><td>' + r.username + '</td><td>' + r.ranking + '</td></tr>');
    document.getElementById('ranking-body').innerHTML = newTableBody.join('\n');
});


// Games part
function gameToTableRow(g) {
    const p1Class = g.winPlayer == g.firstUser ? ' class="win"' : '';
    const p2Class = g.winPlayer == g.secondUser ? ' class="win"' : '';
    return '<tr><td></td><td' + p1Class + '>' + g.firstUser + '</td><td' + p2Class + '>' + g.secondUser + '</td><td>' + g.outcome + '</td><td>' + g.description + '</td></tr>'
}

socket.on('games', (games) => {
    console.log(games);
    const newBody = games.reverse().map(gameToTableRow);
    document.getElementById('games-body').innerHTML = newBody.join('\n');
});
socket.on('game', game => {
    socket.emit('rankings');
    const row = gameToTableRow(game);
    document.getElementById('games-body').innerHTML = row + '\n' + document.getElementById('games-body').innerHTML;
})
