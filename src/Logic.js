const Keymapping = require('./Keymapping');
const IntersectionFinder = require('./intersection/IntersectionFinder');
const LinkedList = require('./util/LinkedList');
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
			this.addIntersectionBounds(this.intersectionFinder.PASSIVE, rock);
		}

		this.projectiles = new LinkedList();

		this.player = new Player(.5, .5);
		this.addIntersectionBounds(this.intersectionFinder.FRIENDLY_UNIT, this.player);

		this.monster = new Monster(.5, .25);
		this.addIntersectionBounds(this.intersectionFinder.HOSTILE_UNIT, this.monster);
	}

	addProjectile(projectile) {
		this.projectiles.add(projectile);
		// todo add to intersection finder and set intersection handle (i.e. call addIntersectionBounds)
	}

	addIntersectionBounds(layer, entity) {
		let intersectionHandle = this.intersectionFinder.addBounds(layer, entity.getBounds());
		if (entity.setIntersectionHandle)
			entity.setIntersectionHandle(intersectionHandle);
	}

	iterate() {
		this.player.update(this, this.controller, this.keymapping, this.intersectionFinder);
		this.monster.update(this);
		this.projectiles.forEach((projectile, item) => {
			if (projectile.update(this.intersectionFinder))
				this.projectiles.remove(item);
		});

		this.paint(this.painter);
	}

	paint(painter) {
		this.rocks.forEach(rock =>
			rock.paint(painter));
		this.player.paint(painter);
		this.monster.paint(painter);
		this.projectiles.forEach(projectile => projectile.paint(painter));

		this.player.paintUi(painter);
		this.monster.paintUi(painter);
	}
}

module.exports = Logic;
