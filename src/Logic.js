const {Keymapping} = require('./Keymapping');
const {IntersectionFinder} = require('./intersection/IntersectionFinder');
const Camera = require('./map/Camera');
const LinkedList = require('./util/LinkedList');
const Rock = require('./entities/Rock');
const Player = require('./entities/Player');
const Turret = require('./entities/monsters/Turret');
const Boss1 = require('./entities/monsters/Boss1');

class Logic {
	constructor(controller, painter) {
		this.controller = controller;
		this.painter = painter;
		this.keymapping = new Keymapping();
		this.intersectionFinder = new IntersectionFinder();
		this.camera = new Camera();

		this.rocks = [];
		for (let i = 0; i < 5; i++) {
			let rock = new Rock(Math.random(), Math.random(), Math.random() * .1, Math.random() * .1);
			this.rocks.push(rock);
			rock.addIntersectionBounds(this.intersectionFinder);
		}

		this.projectiles = new LinkedList();

		this.player = new Player(.5, .5);
		this.player.addIntersectionBounds(this.intersectionFinder);

		this.monsters = [];
		for (let i = 0; i < 5; i++) {
			let monster = new Turret(Math.random(), Math.random());
			this.monsters.push(monster);
			monster.addIntersectionBounds(this.intersectionFinder);
		}

		this.boss1 = new Boss1(.5, .25);
		this.boss1.addIntersectionBounds(this.intersectionFinder);
	}

	addProjectile(projectile) {
		this.projectiles.add(projectile);
		projectile.addIntersectionBounds(this.intersectionFinder);
	}

	iterate() {
		this.update();
		this.paint();
	}

	update() {
		this.camera.move(this.player, this.controller.getRawMouse());
		this.controller.inverseTransformMouse(this.camera);

		this.player.update(this, this.controller, this.keymapping, this.intersectionFinder);
		this.monsters.forEach((monster, item) => {
			if (monster.update(this, this.intersectionFinder, this.player)) {
				this.monstes.remove(item);
				monster.removeIntersectionBounds(this.intersectionFinder);
			}
		});
		this.boss1.update(this, this.intersectionFinder, this.player);
		this.projectiles.forEach((projectile, item) => {
			if (projectile.update(this.intersectionFinder)) {
				this.projectiles.remove(item);
				projectile.removeIntersectionBounds(this.intersectionFinder);
			}
		});
	}

	paint() {
		this.rocks.forEach(rock => rock.paint(this.painter, this.camera));
		this.player.paint(this.painter, this.camera);
		this.monsters.forEach(monster => monster.paint(this.painter, this.camera));
		this.boss1.paint(this.painter, this.camera);
		this.projectiles.forEach(projectile => projectile.paint(this.painter, this.camera));

		this.player.paintUi(this.painter, this.camera);
		this.boss1.paintUi(this.painter, this.camera);
	}
}

module.exports = Logic;

// todo graphics
// particles
// asteroid vectors
// textures
// starfield background

// todo content
// instances
// mobs
// sector modes
// resources
// crafting
// skill leveling

// todo ordered
// add 2 mob types (moving shotgun + stationary far / near turret) (see todo list in Turret.js)
// add larger map
// add map background
// particles
