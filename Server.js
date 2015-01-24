"use strict";

var Game = require('./Game.js');
var Translator = require('./Translator.js');
var WebSocketServer = require('ws').Server;

var server = new WebSocketServer({ port: 8789 });

var games = [];

function updateAllPlayers(game) {
	for (var p in game.players) {
		var player = game.players[p];
		player.changed = true;
	}
}

function join(connection) {
	console.log('Adding new connection.');
	for (var g in games) {
		var game = games[g];
		for (var p in game.players) {
			var player = game.players[p];
			if (player.connection === null) {
				player.connection = connection;
				updateAllPlayers(game);
				connection.game = game;
				connection.send(JSON.stringify({
					command: 'setPlayer',
					id: player.id
				}));
				return;
			}
		}
	}
	var newgame = new Game();
	newgame.players[0].connection = connection;
	updateAllPlayers(newgame);
	connection.game = newgame;
	games.push(newgame);
	connection.send(JSON.stringify({ command: 'setPlayer', id: 0 }));
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
				//console.log('received: %s', message);
				var msg = JSON.parse(message);
				var player = findPlayer(this);
				player.changed = true;
				switch (msg.command) {
					case 'move':
						player.x = msg.x;
						player.y = msg.y;
						break;
					case 'enter':
						player.floor = msg.floor;
						break;
					case 'speak':
						for (var p in connection.game.players) {
							(function () {
								var otherplayer = connection.game.players[p];
								if (otherplayer !== player) {
									Translator.translate(msg.text, otherplayer.language, function (text) {
										if (otherplayer.connection !== null) otherplayer.connection.send(JSON.stringify({command: 'speak', text: text}));
									});
								}
							})();
						}
						break;
					case 'language':
						player.language = msg.language;
						break;
					case 'createDoor':
						connection.game.createDoor(msg.id);
						break;
					case 'doorSetOpened':
						var door1 = connection.game.findDoor(msg.id);
						door1.opened = msg.opened;
						door1.changed = true;
						break;
					case 'doorSetHealth':
						var door2 = connection.game.findDoor(msg.id);
						door2.health = msg.health;
						door2.changed = true;
						break;
				}
			}
			catch (error) {
				console.error('Error in message: ' + error);
			}
		});
		connection.on('close', function () {
			try {
				console.log('Lost a connection.');
				for (var p in this.game.players) {
					var player = this.game.players[p];
					if (player.connection === this) {
						player.changed = true;
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
							if (!person.changed) continue;
							if (person.x < 0) continue;
							if (person.y < 0) continue;
							person.changed = false;
							player.connection.send(JSON.stringify({
								command: 'updatePerson',
								id: person.id,
								x: person.x,
								y: person.y,
								sleeping: person.player && person.connection === null
							}));
						}
						for (var d in floor.doors) {
							var door = floor.doors[d];
							if (!door.changed) continue;
							door.changed = false;
							player.connection.send(JSON.stringify({
								command: 'changeDoor',
								id: door.id,
								opened: door.opened,
								health: door.health
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
