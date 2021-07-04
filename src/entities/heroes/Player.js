import Dash from '../../abilities/Dash.js';
import Death from '../../abilities/Death.js';
import DelayedRegen from '../../abilities/DelayedRegen.js';
import IncDefense from '../../abilities/IncDefense.js';
import ProjectileAttack from '../../abilities/ProjectileAttack.js';
import keyMappings from '../../control/keyMappings.js';
import VShip from '../../graphics/VShip.js';
import Bounds from '../../intersection/Bounds.js';
import IntersectionFinder from '../../intersection/IntersectionFinder.js';
import Bar from '../../painter/elements/Bar.js';
import Rect from '../../painter/elements/Rect.js';
import Text from '../../painter/elements/Text.js';
import RecordsData from '../../playerData/RecordsData.js';
import Stat from '../../playerData/Stat.js';
import StatValues from '../../playerData/StatValues.js';
import TechniqueTree from '../../playerData/TechniqueTree.js';
import {Colors, Positions} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import {avg} from '../../util/number.js';
import EntityObserver from '../EntityObserver.js';
import Hero from './Hero.js';

const TARGET_LOCK_BORDER_SIZE = .04;

// Formatted: [base value, initial stat value]
// E.g., if baseStat = [80, 1] and stat is .5, then basedStat is 80 * (1 +.5)
const BaseStats = {
	// todo [high] make sure the bases here and elsewhere that are set [1,0] or [0,1] are intentional.
	[Stat.Ids.DISABLED]: [1, 0],

	[Stat.Ids.LIFE]: [80, 1],
	[Stat.Ids.LIFE_REGEN]: [.03, 1],
	[Stat.Ids.LIFE_LEECH]: [1, 0],
	[Stat.Ids.STAMINA]: [80, 1],
	[Stat.Ids.STAMINA_REGEN]: [.1, 1],
	[Stat.Ids.STAMINA_GAIN]: [1, 0],
	[Stat.Ids.SHIELD]: [40, 1], // todo [high]
	[Stat.Ids.SHIELD_REGEN]: [.12, 1],
	[Stat.Ids.SHIELD_DELAY]: [0, 0], // todo [high]
	[Stat.Ids.SHIELD_LEECH]: [0, 0], // todo [high]
	[Stat.Ids.ARMOR]: [1, 1],

	[Stat.Ids.DAMAGE]: [0, 0],
	[Stat.Ids.DAMAGE_OVER_TIME]: [0, 0],
	[Stat.Ids.ATTACK_SPEED]: [0, 0], // todo [high]
	[Stat.Ids.ATTACK_RANGE]: [0, 0], // todo [high]
	[Stat.Ids.CRITICAL_CHANCE]: [0, 0], // todo [high]
	[Stat.Ids.CRITICAL_DAMAGE]: [0, 0], // todo [high]

	[Stat.Ids.MOVE_SPEED]: [.005, 1],

	[Stat.Ids.TAKING_DAMAGE_OVER_TIME]: [1, 0],
};

class PlayerBar {
	constructor(barCoordinate, color, drawBack = true) {
		this.averagedValue = 0;
		this.barCoordinate = barCoordinate;
		this.textCoordinate = barCoordinate.clone.move(-Positions.BREAK, 0);
		this.color = color;
		this.drawBack = drawBack;
	}

	static createAll() {
		let coordinate = new Coordinate(1 - Positions.MARGIN, 1 - Positions.MARGIN, Positions.PLAYER_BAR_X, Positions.BAR_HEIGHT)
			.align(Coordinate.Aligns.END, Coordinate.Aligns.END);
		return [
			new PlayerBar(coordinate.clone, Colors.EXP),
			new PlayerBar(coordinate.shift(0, -1).move(0, -Positions.MARGIN / 2).clone, Colors.STAMINA),
			new PlayerBar(coordinate.shift(0, -1).move(0, -Positions.MARGIN / 2), Colors.LIFE),
			new PlayerBar(coordinate, Colors.SHIELD, false), // todo [high] shield color
		];
	}

	paint(painter, fillValue, text) {
		this.averagedValue = avg(this.averagedValue, fillValue, .8);
		if (this.drawBack) {
			painter.add(new Bar(this.barCoordinate, this.averagedValue, this.color.getShade(Colors.BAR_SHADING), this.color.get(), this.color.get(Colors.BAR_SHADING)));
			painter.add(new Text(this.textCoordinate, text).setOptions({color: '#000'}));
		} else {
			painter.add(Bar.createFillRect(this.barCoordinate, this.averagedValue, this.color.get()));
			// todo [high] don't overwrite shield and life texts
			painter.add(new Text(this.textCoordinate, text).setOptions({color: '#000'}));
		}
	}
}

class Player extends Hero {
	constructor(playerData) {
		super(0, 0, .05, .05, BaseStats, playerData.statValues, true, Colors.LIFE, Colors.STAMINA);

		// todo [high] reconnect abilities
		let abilities = [
			new ProjectileAttack(this.statManager.extend(playerData.getTechniqueStatValues(TechniqueTree.Ids.PROJECTILE_ATTACK))),
			new Dash(this.statManager.extend(playerData.getTechniqueStatValues(TechniqueTree.Ids.DASH))),
			new IncDefense(this.statManager.extend(playerData.getTechniqueStatValues(TechniqueTree.Ids.DEFENSE))),
		];
		abilities.forEach((ability, i) => ability.setUi(i));
		let passiveAbilities = [
			// todo [high] consider replace some player stats with abilities; e.g. leech
			new DelayedRegen(this.statManager.extend(new StatValues())),
			new Death(this.statManager.extend(new StatValues())),
		];
		this.initAbilities(abilities, passiveAbilities);

		this.playerData = playerData;
		this.bars = PlayerBar.createAll();
		this.setGraphics(new VShip(.05, .05, {fill: true, color: Colors.Entity.PLAYER.get()}));
	}

	update(map, controller, intersectionFinder, monsterKnowledge) {
		this.refresh();
		this.moveControl(controller, intersectionFinder);
		this.abilityControl(map, controller, intersectionFinder);
		this.targetLockControl(controller, intersectionFinder);
		this.createMovementParticle(map);
	}

	processQueuedEvents() {
		this.getQueuedEvents(EntityObserver.EventIds.KILLED).forEach(monster => {
			this.playerData.expData.gainExp(monster.expValue);
			this.playerData.recordsData.changeRecord(RecordsData.Ids.KILLS, 1);
			// todo [high] gain equipment on kill
			// todo [high] display gained equipment/exp
		});
		super.processQueuedEvents();
	}

	moveControl(controller, intersectionFinder) {
		const invSqrt2 = 1 / Math.sqrt(2);

		let left = keyMappings.moveLeft.getState(controller).active;
		let up = keyMappings.moveUp.getState(controller).active;
		let right = keyMappings.moveRight.getState(controller).active;
		let down = keyMappings.moveDown.getState(controller).active;

		let dx = 0, dy = 0;

		if (left)
			dx -= 1;
		if (up)
			dy -= 1;
		if (right)
			dx += 1;
		if (down)
			dy += 1;

		if (dx && dy) {
			dx = Math.sign(dx) * invSqrt2;
			dy = Math.sign(dy) * invSqrt2;
		}

		this.updateMove(intersectionFinder, dx, dy, this.statManager.getBasedStat(Stat.Ids.MOVE_SPEED));
	}

	abilityControl(map, controller, intersectionFinder) {
		let directTarget = this.targetLock || controller.getMouse();
		let direct = {
			x: directTarget.x - this.x,
			y: directTarget.y - this.y,
		};
		let activeAbilitiesWanted = this.abilities.map((_, i) => keyMappings.ABILITY_I[i].getState(controller).active);
		this.updateAbilities(map, intersectionFinder, activeAbilitiesWanted, direct);
	}

	targetLockControl(controller, intersectionFinder) {
		if (this.targetLock && this.targetLock.health.isEmpty())
			this.targetLock = null;

		if (!keyMappings.targetLock.getState(controller).pressed)
			return;

		if (this.targetLock) {
			this.targetLock = null;
			return;
		}

		let mouse = controller.getMouse();
		let targetLockBounds = new Bounds(
			mouse.x - TARGET_LOCK_BORDER_SIZE / 2,
			mouse.y - TARGET_LOCK_BORDER_SIZE / 2,
			mouse.x + TARGET_LOCK_BORDER_SIZE / 2,
			mouse.y + TARGET_LOCK_BORDER_SIZE / 2);
		this.targetLock = intersectionFinder.hasIntersection(IntersectionFinder.Layers.HOSTILE_UNIT, targetLockBounds);
	}

	removeUi() {
		return false;
	}

	paintUi(painter, camera) {
		// target lock
		// todo [medium] target lock draws over monster health bar
		if (this.targetLock) {
			let coordinate = new Coordinate(this.targetLock.x, this.targetLock.y, this.targetLock.width + TARGET_LOCK_BORDER_SIZE, this.targetLock.height + TARGET_LOCK_BORDER_SIZE).align(Coordinate.Aligns.CENTER);
			painter.add(Rect.withCamera(camera, coordinate, {color: Colors.TARGET_LOCK.get(), thickness: 3}));
		}

		// life, stamina, and exp bars
		this.bars[0].paint(painter, this.playerData.expData.exp / this.playerData.expData.expRequired, this.playerData.expData.levelExpText);
		this.bars[1].paint(painter, this.stamina.getRatio(), Math.floor(this.stamina.value));
		this.bars[2].paint(painter, this.health.getRatio(), Math.floor(this.health.value));
		this.bars[3].paint(painter, this.shield.getRatio(), Math.floor(this.shield.value));

		// abilities
		this.abilities.forEach(ability => ability.paintUi(painter, camera));

		// buffs
		this.statManager.buffs
			.filter(buff => buff.visible)
			.forEach((buff, i) => buff.paintUi(painter, i));

		// damage overlay
		let damageColor = Colors.DAMAGE.getAlpha(this.recentDamage.get());
		painter.add(new Rect(new Coordinate(0, 0, 1)).setOptions({fill: true, color: damageColor}));
	}
}

Player.BaseStats = BaseStats;

export default Player;
