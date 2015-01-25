"use strict";

var Person = function (id, player) {
	this.id = id;
	this.x = -100;
	this.y = -100;
	this.player = player;
	this.connection = null;
	this.floor = -1;
	this.changed = false;
	this.language = 'en';
};

Person.prototype.run = function () {

};

var Item = function () {

};

var Door = function (id) {
	this.id = id;
	this.opened = false;
	this.health = 100;
	this.changed = false;
};

var Floor = function () {
	this.persons = [];
	this.doors = [];
	this.items = [];

	this.doors.push(new Door(0));
	this.doors.push(new Door(1));
	this.doors.push(new Door(2));
};

var Game = function () {
	this.players = [];
	this.players.push(new Person(0, true));
	this.players.push(new Person(1, true));

	this.floors = [];
	this.floors.push(new Floor());
	this.floors.push(new Floor());

	this.setFloor(this.players[0], 0);
	this.setFloor(this.players[1], 0);

	this.floors[0].items.push(new Item());
};

Game.prototype.setFloor = function (player, floor) {
	if (player.floor !== -1) {
		this.floors[player.floor].persons.remove(player);
	}
	this.floors[floor].persons.push(player);
	player.floor = floor;
};

Game.prototype.findDoor = function (id) {
	for (var d in this.floors[0].doors) {
		var door = this.floors[0].doors[d];
		if (door.id === id) return door;
	}
	return null;
};

module.exports = Game;
