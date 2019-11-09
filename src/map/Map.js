const IntersectionFinder = require('../intersection/IntersectionFinder');
const LinkedList = require('../util/LinkedList');
const Bounds = require('../intersection/Bounds');
const Rect = require('../painter/Rect');

class Map {
	constructor() {
		this.intersectionFinder = new IntersectionFinder();
		this.stills = new LinkedList();
		this.monsters = new LinkedList();
		this.projectiles = new LinkedList();
		this.particles = new LinkedList();
		this.uis = new LinkedList();
	}

	setSize(width, height) {
		this.width = width;
		this.height = height;
	}

	getSize() {
		return [this.width, this.height];
	}

	addStill(still) {
		this.stills.add(still);
		still.addIntersectionBounds(this.intersectionFinder);
	}

	addPlayer(player) {
		this.player = player;
		player.addIntersectionBounds(this.intersectionFinder);
		this.uis.add(player);
	}

	addMonster(monster, ui) {
		this.monsters.add(monster);
		monster.addIntersectionBounds(this.intersectionFinder);
		if (ui)
			this.uis.add(monster);
	}

	addUi(ui) {
		this.uis.add(ui);
	}

	addProjectile(projectile) { // todo [high] rename to addAttack or such
		this.projectiles.add(projectile);
		projectile.addIntersectionBounds(this.intersectionFinder);
	}

	addParticle(particle) {
		this.particles.add(particle);
	}

	update(controller, monsterKnowledge) {
		this.player.update(this, controller, this.intersectionFinder, monsterKnowledge);
		this.monsters.forEach((monster, item) => {
			if (monster.health.isEmpty()) {
				this.monsters.remove(item);
				monster.removeIntersectionBounds(this.intersectionFinder);
			} else
				monster.update(this, this.intersectionFinder, monsterKnowledge);
		});
		this.projectiles.forEach((projectile, item) => {
			if (projectile.update(this, this.intersectionFinder)) {
				this.projectiles.remove(item);
				projectile.removeIntersectionBounds(this.intersectionFinder);
			}
		});
		this.particles.forEach((particle, item) => {
			if (particle.update())
				this.particles.remove(item);
		});
	}

	paint(painter, camera) {
		this.stills.forEach(still => still.paint(painter, camera));
		this.player.paint(painter, camera);
		this.monsters.forEach(monster => monster.paint(painter, camera));
		this.projectiles.forEach(projectile => projectile.paint(painter, camera));
		this.particles.forEach(particle => particle.paint(painter, camera));
	}

	paintUi(painter, camera) {
		this.uis.forEach((ui, iter) => {
			if (ui.removeUi())
				this.uis.remove(iter);
			else
				ui.paintUi(painter, camera);
		});
	}
}

module.exports = Map;

// todo [medium] consider static & dynamic entity lists in stead of individual type entity lists
