import IntersectionFinder from '../intersection/IntersectionFinder.js';
import LinkedList from '../util/LinkedList.js';

class Map {
	constructor() {
		this.intersectionFinder = new IntersectionFinder();
		this.stills = new LinkedList();
		this.bots = new LinkedList();
		this.botHeroes = new LinkedList();
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

	get heroes() {
		return [this.player, ...this.botHeroes];
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

	addBot(bot) {
		this.bots.add(bot);
		bot.botHeroes.forEach(botHero => this.addBotHero(botHero));
	}

	addBotHero(botHero) {
		this.botHeroes.add(botHero);
		botHero.addIntersectionBounds(this.intersectionFinder);
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

	addProjectile(projectile) { // todo [medium] rename to addAttack or such
		this.projectiles.add(projectile);
		projectile.addIntersectionBounds(this.intersectionFinder);
	}

	addParticle(particle) {
		this.particles.add(particle);
	}

	update(controller, monsterKnowledge) {
		this.player.update(this, controller, this.intersectionFinder, monsterKnowledge);
		this.bots.forEach(bot => bot.update(this, this.intersectionFinder, monsterKnowledge));
		this.monsters.forEach((monster, item) => {
			if (monster.health.isEmpty()) {
				this.monsters.remove(item);
				monster.removeIntersectionBounds(this.intersectionFinder);
				this.player.onKill(monster);
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
		this.botHeroes.forEach(botHero => botHero.paint(painter, camera));
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

export default Map;

// todo [medium] consider static & dynamic entity lists in stead of individual type entity lists
