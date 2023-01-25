const debug = require('debug')('chat:socket_controller');

module.exports = function(socket) {
	debug('a new client has connected', socket.id);
}