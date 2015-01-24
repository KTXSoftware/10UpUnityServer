"use strict";

var Game = require('./Game.js');

var WebSocketServer = require('ws').Server;

var server = new WebSocketServer({ port: 8789 });

var games = [];

function join(connection) {
	for (var g in games) {
		var game = games[g];
		for (var p in game.players) {
			var player = game.players[p];
			if (player.connection === null) {
				player.connection = connection;
				connection.game = game;
				return;
			}
		}
	}
	var newgame = new Game();
	newgame.players[0].connection = connection;
	connection.game = newgame;
	games.push(newgame);
}

server.on('connection', function connection(connection) {
	try {
		join(connection);
		connection.on('message', function incoming(message) {
			try {
				console.log('received: %s', message);
				var msg = JSON.parse(message);
				switch (msg.command) {
					case 'move':
						for (var p in this.game.players) {
							var player = this.game.players[p];
							if (player.connection === this) {
								player.x = msg.x;
								player.y = msg.y;
								break;
							}
						}
						break;
				}
			}
			catch (error) {
				console.error('Error in message: ' + error);
			}
		});
		connection.on('close', function () {
			try {
				for (var p in this.game.players) {
					var player = this.game.players[p];
					if (player.connection === this) {
						player.connection = null;
						return;
					}
				}
			}
			catch (error) {
				console.error('Error in close: ' + error);
			}
		});
	}
	catch (error) {
		console.error('Error in connection: ' + error);
	}
});

setTimeout(function () {
	try {
		for (var g in games) {
			var game = games[g];
			for (var p in game.players) {
				var player = game.players[p];
				if (player.connection !== null) {
					player.connection.send(JSON.stringify({}));
				}
			}
		}
	}
	catch (error) {
		console.error('Error in timeout: ' + error);
	}
}, 100);
