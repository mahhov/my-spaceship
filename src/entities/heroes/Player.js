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
import Stat from '../../playerData/Stat.js';
import {Colors, Positions} from '../../util/Constants.js';
import Coordinate from '../../util/Coordinate.js';
import Buff from '.././Buff.js';
import Hero from './Hero.js';

const TARGET_LOCK_BORDER_SIZE = .04;

class Player extends Hero {
	// todo [medium] deprecated
	static defaultConstructor() {
		let abilities = [
			new ProjectileAttack(),
			new Dash(),
			new IncDefense(),
		];
		abilities.forEach((ability, i) => ability.setUi(i));
		let passiveAbilities = [
			new DelayedRegen(),
			new Death(),
		];

		let player = new Player(0, 0, .05, .05, 80, 80, .13, true, abilities, passiveAbilities, Colors.LIFE, Colors.STAMINA);
		player.setGraphics(new VShip(.05, .05, {fill: true, color: Colors.Entity.PLAYER.get()}));
		return player;
	}

	update(map, controller, intersectionFinder, monsterKnowledge) {
		this.refresh();
		this.moveControl(controller, intersectionFinder);
		this.abilityControl(map, controller, intersectionFinder);
		this.targetLockControl(controller, intersectionFinder);
		this.createMovementParticle(map);
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

		this.updateMove(intersectionFinder, dx, dy, .005 * (1 + Buff.sum(this.buffs, Stat.Ids.MOVE_SPEED)));
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

	refresh() {
		super.refresh();
		this.buffs.forEach((buff, i) => buff.setUiIndex(i));
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

		// life & stamina bar
		const HEIGHT_WITH_MARGIN = Positions.BAR_HEIGHT + Positions.MARGIN;
		let staminaCoordinate = new Coordinate(Positions.PLAYER_BAR_X, 1 - HEIGHT_WITH_MARGIN, 1 - Positions.PLAYER_BAR_X - Positions.MARGIN, Positions.BAR_HEIGHT);
		painter.add(new Bar(staminaCoordinate, this.stamina.getRatio(), Colors.STAMINA.getShade(Colors.BAR_SHADING), Colors.STAMINA.get(), Colors.STAMINA.get(Colors.BAR_SHADING)));
		let healthCoordinate = staminaCoordinate.clone.move(0, -HEIGHT_WITH_MARGIN);
		painter.add(new Bar(healthCoordinate, this.health.getRatio(), Colors.LIFE.getShade(Colors.BAR_SHADING), Colors.LIFE.get(), Colors.LIFE.get(Colors.BAR_SHADING)));

		// life & stamina numbers
		let textOptions = {color: '#000'};
		painter.add(new Text(staminaCoordinate.clone.alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.CENTER).move(-Positions.BREAK, 0), Math.floor(this.stamina.get())).setOptions(textOptions));
		painter.add(new Text(healthCoordinate.clone.alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.CENTER).move(-Positions.BREAK, 0), Math.floor(this.health.get())).setOptions(textOptions));

		// abilities
		this.abilities.forEach(ability => ability.paintUi(painter, camera));

		// buffs
		this.buffs.forEach(buff => buff.paintUi(painter, camera));

		// damage overlay
		let damageColor = Colors.DAMAGE.getAlpha(this.recentDamage.get());
		painter.add(new Rect(new Coordinate(0, 0, 1)).setOptions({fill: true, color: damageColor}));
	}
}

export default Player;
