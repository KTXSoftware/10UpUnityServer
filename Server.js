"use strict";

var WebSocketServer = require('ws').Server;

var server = new WebSocketServer({ port: 8789 });

var connections = [];

server.on('connection', function connection(connection) {
	connections.push(connection);
	connection.on('message', function incoming(message) {
		console.log('received: %s', message);
		for (let c in connections) {
			let conn = connections[c];
			if (conn !== connection) {
				conn.send(message);
			}
		}
	});
});
