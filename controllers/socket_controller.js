const debug = require('debug')('chat:socket_controller');

let io = null;

const users = {};
const sessions = [];

const handleDisconnect = function() {
	debug(`Client ${this.id} disconnected :(`);

	this.broadcast("user:disconnected", users[this.id]);

	delete users[this.id];
}

const handleUserJoined = function(username, callback) {
	users[this.id] = username;

	const startGame = createSession(this, username);

	debug(`User ${username} with socket id ${this.id} joined`);

	this.broadcast.emit("user:connected", username);

	callback({
		success: true,
		start: startGame,
	})
}

const createSession = function(socket, username) {
	let sessionToJoin = null;

	let startGame = false;

	if (sessions.length < 1) {
		sessions.push({
			player1: socket.id,
			player2: "",
			full: false,
		})
		sessionToJoin = socket.id;
	} else {
		sessions.map(session => {
			if (session.full === false) {
				session.player2 = socket.id;
				session.full = true;
				sessionToJoin = session.player1;
				startGame = true;
			} else {
				sessions.push({
					player1: socket.id,
					player2: "",
					full: false,
				})
				sessionToJoin = socket.id;
			}
		})
	}

	debug(sessions);

	debug(`User ${username} joined session ${sessionToJoin}`);

	socket.broadcast.to(sessionToJoin).emit("user:session", username, sessionToJoin, startGame);

	return startGame;
}

const handleGame = function(callback) {
	const y = Math.floor(Math.random() * 10) + 1;
	const x = Math.floor(Math.random() * 15) + 1;

	const time = Math.floor(Math.random() * 4000) + 1;

	callback({
		success: true,
		y: y,
		x: x,
		time: time,
	})
}


module.exports = function(socket, _io) {
	io = _io;

	socket.on("disconnect", handleDisconnect);

	socket.on("user:joined", handleUserJoined);

	socket.on("user:startgame", handleGame);
	
}