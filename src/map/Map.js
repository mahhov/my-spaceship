const IntersectionFinder = require('../intersection/IntersectionFinder');
const LinkedList = require('../util/LinkedList');
const Rock = require('../entities/Rock');
const Player = require('../entities/Player');
const Turret = require('../entities/monsters/Turret');
const ShotgunWarrior = require('../entities/monsters/ShotgunWarrior');
const Boss1 = require('../entities/monsters/Boss1');

const ROCKS = 5, TURRETS = 5, SHOTGUN_WARRIORS = 5;

class Map {
	constructor() {
		this.intersectionFinder = new IntersectionFinder();
	}

	populate() {
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

	getPlayer() {
		return this.player;
	}

	add() {

	}

	addProjectile(projectile) {
		this.projectiles.add(projectile);
		projectile.addIntersectionBounds(this.intersectionFinder);
	}

	update(controller, keymapping) {
		this.player.update(this, controller, keymapping, this.intersectionFinder);
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

	paint(painter, camera) {
		this.rocks.forEach(rock => rock.paint(painter, camera));
		this.player.paint(painter, camera);
		this.monsters.forEach(monster => monster.paint(painter, camera));
		this.boss1.paint(painter, camera);
		this.projectiles.forEach(projectile => projectile.paint(painter, camera));
	}
}

module.exports = Map;
