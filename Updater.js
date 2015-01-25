"use strict";

exports.updatePerson = function (player, person) {
	if (player.connection === null) return;
	player.connection.send(JSON.stringify({
		command: 'updatePerson',
		id: person.id,
		x: person.x,
		y: person.y,
		sleeping: person.player && person.connection === null
	}));
};

exports.updateDoor = function (player, door) {
	if (player.connection === null) return;
	player.connection.send(JSON.stringify({
		command: 'changeDoor',
		id: door.id,
		opened: door.opened,
		health: door.health
	}));
};

exports.updateElevator = function (player, elevator) {
	if (player.connection === null) return;
	player.connection.send(JSON.stringify({
		command: 'updateElevator',
		floor: elevator.floor
	}));
};
