"use strict";

var Game = require('./Game.js');
var Translator = require('./Translator.js');
var Updater = require('./Updater.js');
var WebSocketServer = require('ws').Server;

var server = new WebSocketServer({ port: 8789 });

var games = [];

function join(connection) {
	console.log('Adding new connection.');
	for (var g in games) {
		var game = games[g];
		for (var p in game.players) {
			var player = game.players[p];
			if (player.connection === null) {
				player.connection = connection;
				connection.game = game;
				connection.send(JSON.stringify({
					command: 'setPlayer',
					id: player.id
				}));
				connection.game.setFloor(player, player.floor);
				return;
			}
		}
	}
	var newgame = new Game();
	newgame.players[0].connection = connection;
	connection.game = newgame;
	games.push(newgame);
	connection.send(JSON.stringify({ command: 'setPlayer', id: 0 }));
	connection.game.setFloor(newgame.players[0], newgame.players[0].floor);
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

function findOtherPlayer(connection) {
	for (var p in connection.game.players) {
		var player = connection.game.players[p];
		if (player.connection !== null && player.connection !== connection) {
			return player;
		}
	}
	return null;
}

function onSameFloor(player1, player2) {
	if (player1 === null) return false;
	if (player2 === null) return false;
	return player1.floor === player2.floor;
}

server.on('connection', function connection(connection) {
	try {
		join(connection);
		connection.on('message', function incoming(message) {
			try {
				//console.log('received: %s', message);
				var msg = JSON.parse(message);
				var player = findPlayer(this);
				var otherplayer = findOtherPlayer(this);
				switch (msg.command) {
					case 'move':
						player.x = msg.x;
						player.y = msg.y;
						if (onSameFloor(player, otherplayer)) {
							Updater.updatePerson(otherplayer, player);
						}
						break;
					case 'enter':
						player.floor = msg.floor;
						break;
					case 'speak':
						(function () {
							if (onSameFloor(player, otherplayer)) {
								Translator.translate(msg.text, otherplayer.language, function (text) {
									if (onSameFloor(player, otherplayer)) {
										otherplayer.connection.send(JSON.stringify({command: 'speak', text: text}));
									}
								});
							}
						})();
						break;
					case 'language':
						player.language = msg.language;
						break;
					case 'doorSetOpened':
						var door1 = connection.game.findDoor(player.floor, msg.id);
						door1.opened = msg.opened;
						if (onSameFloor(player, otherplayer)) {
							Updater.updateDoor(otherplayer, door1);
						}
						break;
					case 'doorSetHealth':
						var door2 = connection.game.findDoor(msg.id);
						door2.health = msg.health;
						if (onSameFloor(player, otherplayer)) {
							Updater.updateDoor(otherplayer, door2);
						}
						break;
					case 'callElevator':
						connection.game.elevator.goto(player.floor);
						break;
					case 'useElevator':
						connection.game.elevator.persons.push(player);
						connection.game.elevator.goto(msg.destination);
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
						player.connection = null;
						if (this.game.players[0].connection === null && this.game.players[1].connection === null) {
							var index = games.indexOf(this.game);
							games.splice(index, 1);
							console.log('Removing game.');
						}
						else {
							if (player === this.game.players[1]) Updater.updatePerson(this.game.players[0], this.game.players[1]);
							else Updater.updatePerson(this.game.players[1], this.game.players[0]);
						}
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
