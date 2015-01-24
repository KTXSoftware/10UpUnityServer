"use strict";

var Game = require('./Game.js');
var Translator = require('./Translator.js');
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

function findPlayer(connection) {
	for (var p in connection.game.players) {
		var player = connection.game.players[p];
		if (player.connection === connection) {
			return player;
		}
	}
	return null;
}

server.on('connection', function connection(connection) {
	try {
		join(connection);
		connection.on('message', function incoming(message) {
			try {
				console.log('received: %s', message);
				var msg = JSON.parse(message);
				var player = findPlayer(this);
				switch (msg.command) {
					case 'move':
						player.x = msg.x;
						player.y = msg.y;
						break;
					case 'enter':
						player.floor = msg.floor;
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

function sendUpdates() {
	try {
		for (var g in games) {
			var game = games[g];
			for (var p in game.players) {
				var player = game.players[p];
				if (player.connection !== null && player.floor !== -1) {
					for (var f in game.floors) {
						var floor = game.floors[f];
						for (var per in floor.persons) {
							var person = floor.persons[per];
							if (person === player) continue;
							player.connection.send(JSON.stringify({
								command: 'updatePerson',
								x: person.x,
								y: person.y,
								sleeping: person.player && person.connection === null
							}));
						}
					}
				}
			}
		}
	}
	catch (error) {
		console.error('Error in timeout: ' + error);
	}
	setTimeout(sendUpdates, 100);
}

sendUpdates();

//Translator.translate('Guten Tag, wer bist Du denn?', 'en', function (translation) {
//	console.log('Translation:' +  translation);
//});
