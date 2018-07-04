const Keymapping = require('./Keymapping');
const IntersectionFinder = require('./intersection/IntersectionFinder');
const Rock = require('./entities/Rock');
const Player = require('./entities/Player');
const Monster = require('./entities/Monster');

class Logic {
	constructor(controller, painter) {
		this.controller = controller;
		this.painter = painter;
		this.keymapping = new Keymapping();
		this.intersectionFinder = new IntersectionFinder();

		this.rocks = [];
		for (let i = 0; i < 5; i++) {
			let rock = new Rock(Math.random(), Math.random(), Math.random() * .1, Math.random() * .1);
			this.rocks.push(rock);
			this.intersectionFinder.addBounds(this.intersectionFinder.PASSIVE, rock.getBounds());
		}

		this.player = new Player(.5, .5);
		let playerIntersectionHandle = this.intersectionFinder.addBounds(this.intersectionFinder.FRIENDLY_UNIT, this.player.getBounds());
		this.player.setIntersectionHandle(playerIntersectionHandle);

		this.monster = new Monster(.5, .25);
		let monsterIntersectionHandle = this.intersectionFinder.addBounds(this.intersectionFinder.HOSTILE_UNIT, this.monster.getBounds());
		this.monster.setIntersectionHandle(monsterIntersectionHandle);
	}

	iterate() {
		this.player.move(this.controller, this.keymapping, this.intersectionFinder);
		this.monster.moveRandomly();

		this.paint(this.painter);
	}

	paint(painter) {
		this.rocks.forEach(rock =>
			rock.paint(painter));
		this.player.paint(painter);
		this.monster.paint(painter);
		this.player.paintUi(painter);
		this.monster.paintUi(painter);
	}
}

module.exports = Logic;
