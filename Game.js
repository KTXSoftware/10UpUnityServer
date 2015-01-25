"use strict";

var Updater = require('./Updater.js');

var Person = function (id, player) {
	this.id = id;
	this.x = -100;
	this.y = -100;
	this.player = player;
	this.connection = null;
	this.floor = -1;
	this.language = 'en';
};

var Door = function (id, floor) {
	this.id = id;
	this.floor = floor;
	this.opened = false;
	this.health = 100;
};

var Elevator = function (game, floor) {
	this.game = game;
	this.floor = floor;
	this.next = [];
	this.up = false;
	this.busy = false;
};

Elevator.prototype.sort = function () {
	if (this.next.length === 1) {
		this.up = this.next > this.floor;
	}
	else {
		if (this.up) {
			this.next.sort(function (a, b) {
				return a > b;
			});
		}
		else {
			this.next.sort(function (a, b) {
				return a < b;
			});
		}
	}
};

Elevator.prototype.arrive = function () {
	this.floor = this.next.pop();
	this.sendUpdates();
	if (this.next.length > 0) {
		var self = this;
		setTimeout(function () {
			self.floor = -1;
			self.sendUpdates();
			setTimeout(function () {
				self.arrive();
			}, 5 * 1000);
		}, 5 * 1000);
	}
	else {
		this.busy = false;
	}
};

Elevator.prototype.sendUpdates = function () {
	for (var p in this.game.players) {
		var player = this.game.players[p];
		Updater.updateElevator(player, this);
	}
};

Elevator.prototype.goto = function (floor) {
	this.next.push(floor);
	this.sort();
	if (this.busy) return;
	this.busy = true;
	var self = this;
	setTimeout(function () {
		self.floor = -1;
		self.sendUpdates();
		setTimeout(function () {
			self.arrive();
		}, 5 * 1000);
	}, 5 * 1000);
};

var Floor = function (id) {
	this.id = id;
	this.persons = [];
	this.doors = [];

	this.doors.push(new Door(0, this.id));
	this.doors.push(new Door(1, this.id));
	this.doors.push(new Door(2, this.id));
};

var Game = function () {
	this.elevator = new Elevator(this, 0);

	this.players = [];
	this.players.push(new Person(0, true));
	this.players.push(new Person(1, true));

	this.floors = [];
	this.floors.push(new Floor(0));
	this.floors.push(new Floor(1));
	this.floors.push(new Floor(2));

	this.setFloor(this.players[0], 0);
	this.setFloor(this.players[1], 1);
};

Game.prototype.setFloor = function (player, floor) {
	if (player.floor !== -1) {
		this.floors[player.floor].persons.remove(player);
	}
	this.floors[floor].persons.push(player);
	player.floor = floor;

	for (var p in floor.persons) {
		var person = floor.persons[p];
		if (person !== player) Updater.updatePerson(player, person);
	}

	for (var d in floor.doors) {
		var door = floor.doors[d];
		Updater.updateDoor(player, door);
	}
};

Game.prototype.findDoor = function (floor, id) {
	for (var d in this.floors[floor].doors) {
		var door = this.floors[floor].doors[d];
		if (door.id === id) return door;
	}
	return null;
};

module.exports = Game;
