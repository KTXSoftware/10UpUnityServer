"use strict";

var Person = function (id, player) {
	this.id = id;
	this.x = 0;
	this.y = 0;
	this.player = player;
	this.connection = null;
	this.floor = -1;
};

Person.prototype.run = function () {

};

var Item = function () {

};

var Floor = function () {
	this.persons = [];
	this.items = [];
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

module.exports = Game;
