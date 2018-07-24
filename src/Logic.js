const Keymapping = require('./Keymapping');
const IntersectionFinder = require('./intersection/IntersectionFinder');
const Camera = require('./map/Camera');
const LinkedList = require('./util/LinkedList');
const Rock = require('./entities/Rock');
const Player = require('./entities/Player');
const Turret = require('./entities/monsters/Turret');
const ShotgunWarrior = require('./entities/monsters/ShotgunWarrior');
const Boss1 = require('./entities/monsters/Boss1');

const UI = true;
const ROCKS = 5, TURRETS = 5, SHOTGUN_WARRIORS = 5;

class Logic {
	constructor(controller, painter) {
		this.controller = controller;
		this.painter = painter;
		this.keymapping = new Keymapping();
		this.intersectionFinder = new IntersectionFinder();
		this.camera = new Camera();

		this.rocks = [];
		for (let i = 0; i < ROCKS; i++) {
			let rock = new Rock(Math.random(), Math.random(), Math.random() * .1, Math.random() * .1);
			this.rocks.push(rock);
			rock.addIntersectionBounds(this.intersectionFinder);
		}

		this.projectiles = new LinkedList();

		this.player = new Player(.5, .5);
		this.player.addIntersectionBounds(this.intersectionFinder);

		this.monsters = new LinkedList();

		for (let i = 0; i < TURRETS; i++) {
			let monster = new Turret(Math.random(), Math.random());
			this.monsters.add(monster);
			monster.addIntersectionBounds(this.intersectionFinder);
		}

		for (let i = 0; i < SHOTGUN_WARRIORS; i++) {
			let monster = new ShotgunWarrior(Math.random(), Math.random());
			this.monsters.add(monster);
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
			if (monster.isEmptyHealth()) {
				this.monsters.remove(item);
				monster.removeIntersectionBounds(this.intersectionFinder);
			} else
				monster.update(this, this.intersectionFinder, this.player);
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

		if (UI) {
			this.player.paintUi(this.painter, this.camera);
			this.boss1.paintUi(this.painter, this.camera);
		}
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

// todo x ordered
// add 2 mob types (moving shotgun + stationary far / near turret)
// add larger map
// add map background
// particles
// refactor health, stamina, cooldown to share utility. maybe converge with decay and phase as well
// refactor coordinate system to support coordintaes, centered coordintaes, and camera coordintaes to replace current constructor overloading
// reset target lock if target expires
