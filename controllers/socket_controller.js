const debug = require('debug')('chat:socket_controller');

let io = null;

let sessions = [];

let playerDisconnected;
let thisSession = false;

const handleDisconnect = function() {
	debug(`Client ${this.id} disconnected :(`);

	if (sessions.find(s => s.player1 === this.id)) {
		thisSession = sessions.find(s => s.player1 === this.id);
		playerDisconnected = thisSession.player1Name;
		thisSession.player1 = "";
		console.log("player 1 disconnected in", thisSession);

		if (thisSession.player2 === "") {
			sessions = sessions.filter(s => s.id !== thisSession.id);
			console.log("sessions", sessions);
		}
	}

	if (sessions.find(s => s.player2 === this.id)) {
		thisSession = sessions.find(s => s.player2 === this.id);
		playerDisconnected = thisSession.player2Name;
		thisSession.player2 = "";
		console.log("player 2 disconnected in", thisSession);

		if (thisSession.player1 === "") {
			sessions = sessions.filter(s => s.id !== thisSession.id);
			console.log("sessions", sessions);
		}
	}

	if (thisSession.id) {
		io.in(thisSession.id).emit("user:disconnect", playerDisconnected)
	}
}

const createSession = function(socket, username) {
	let sessionToJoin = null;

	let startGame = false;

	if (sessions.length < 1) {
		sessions.push({
			id: socket.id,
			player1Name: username,
			player1: socket.id,
			player2Name: "",
			player2: "",
			full: false,
			player1Wins: 0,
			player2Wins: 0,
			rounds: 0,
		})
		sessionToJoin = socket.id;
	} else {
		sessions.map(session => {
			if (session.full === false) {
				session.player2Name = username;
				session.player2 = socket.id;
				session.full = true;
				sessionToJoin = session.id;
				startGame = true;
			}
		})

		if (!startGame) {
			sessions.push({
				id: socket.id,
				player1Name: username,
				player2Name: "",
				player2: "",
				full: false,
				player1Wins: 0,
				player2Wins: 0,
				rounds: 0,
			})
			sessionToJoin = socket.id;
		}
	}

	debug(sessions);

	socket.join(sessionToJoin);

	debug(`User ${username} joined session ${sessionToJoin}`);

	io.in(sessionToJoin).emit("user:session", username, sessionToJoin, startGame);

	return {
		start: startGame,
		session: sessionToJoin,
		player: socket.id,
	}
}

const handleUserJoined = function(username, callback) {

	const startGame = createSession(this, username);

	debug(`User ${username} with socket id ${this.id} joined`);

	this.broadcast.emit("user:connected", username);

	callback({
		success: true,
		start: startGame.start,
		session: startGame.session,
		player: startGame.player,
	})
}

let player1Here = false;
let player2Here = false;

const handleGame = function(session, player) {
	const thisSession = sessions.find(s => s.id === session)

	if (thisSession.player1 === player) {
		player1Here = true;
		console.log("Player 1", player1Here);
	} 

	if (thisSession.player2 === player) {
		player2Here = true;
		console.log("Player 2", player2Here);
	}

	if (!player1Here && player2Here || player1Here && !player2Here) {
		return;
	}

	const y = Math.floor(Math.random() * 10) + 1;
	const x = Math.floor(Math.random() * 15) + 1;

	const time = Math.floor(Math.random() * 4000) + 1;

	const data = {
		success: true,
		session,
		y: y,
		x: x,
		time: time,
	}

	player1Here = false;
	player2Here = false;

	io.in(session).emit("game:success", data);
}

let compareReaction;
let winner;
let keepRunning;
let player1Reaction;
let player2Reaction;

const handleGamePoint = function(reactionTime, player, session) {
	const thisSession = sessions.find(s => s.id === session);

	if (thisSession.player1 === player) {
		player1Here = true;
		console.log("player1 game point")
		
	} 

	if (thisSession.player2 === player) {
		player2Here = true;
		console.log("player2 game point");
	}

	if (!player1Here && player2Here || player1Here && !player2Here) {
		compareReaction = {
			reactionTime,
			player,
		}
		return;
	}

	thisSession.player1 === compareReaction.player ? player1Reaction = compareReaction.reactionTime : player2Reaction = compareReaction.reactionTime;

	thisSession.player1 === player ? player1Reaction = reactionTime : player2Reaction = reactionTime;

	thisSession.rounds++;

	compareReaction.reactionTime > reactionTime ? winner = player : winner = compareReaction.player;

	thisSession.player1 === winner ? thisSession.player1Wins++ : thisSession.player2Wins++;

	if (thisSession.rounds === 10) {
		keepRunning = false;
	} else {
		keepRunning = true;
	}

	const points = {
		player1Name: thisSession.player1Name,
		player1: thisSession.player1,
		player1Points: thisSession.player1Wins,
		player1React: player1Reaction,
		player2Name: thisSession.player2Name,
		player2: thisSession.player2,
		player2Points: thisSession.player2Wins,
		player2React: player2Reaction,
	}

	player1Here = false;
	player2Here = false;

	io.in(session).emit("game:result", winner, points, keepRunning, session);
}

let winnerGame;
const handleGameOver = function(session) {
	const thisSession = sessions.find(s => s.id === session);

	if (thisSession.player1Wins > thisSession.player2Wins) {
		winnerGame = thisSession.player1;
	} else {
		winnerGame = thisSession.player2;
	}

	io.in(session).emit("game:endresult", winnerGame, session);
}

const handleGameRestart = function(session, player) {
	const thisSession = sessions.find(s => s.id === session);
	
	if (thisSession.player1 === player) {
		player1Here = true;
	}

	if (thisSession.player2 === player) {
		player2Here = true;
	}

	if (!player1Here && player2Here || player1Here && !player2Here) {
		return;
	}

	thisSession.player1Wins = 0;
	thisSession.player2Wins = 0;
	thisSession.rounds = 0;

	player1Here = false;
	player2Here = false;

	io.in(session).emit("game:restarted", session);
}

module.exports = function(socket, _io) {
	io = _io;

	socket.on("disconnect", handleDisconnect);

	socket.on("user:joined", handleUserJoined);

	socket.on("user:startgame", handleGame);

	socket.on("game:point", handleGamePoint);

	socket.on("game:end", handleGameOver);

	socket.on("game:restart", handleGameRestart);	
}