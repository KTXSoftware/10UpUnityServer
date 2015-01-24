"use strict";

var Person = function (id, player) {
	this.id = id;
	this.x = 0;
	this.y = 0;
	this.player = player;
	this.connection = null;
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

	this.floors[0].persons.push(this.players[0]);
	this.floors[1].persons.push(this.players[1]);

	this.floors[0].items.push(new Item());
};

module.exports = Game;
