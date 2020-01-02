const Hero = require('./Hero');
const IntersectionFinder = require('../intersection/IntersectionFinder');
const {Colors, Positions} = require('../util/Constants');
const VShip = require('../graphics/VShip');
const ProjectileAttack = require('../abilities/ProjectileAttack');
const Dash = require('../abilities/Dash');
const IncDefense = require('../abilities/IncDefense');
const DelayedRegen = require('../abilities/DelayedRegen');
const Buff = require('./Buff');
const Keymapping = require('../control/Keymapping');
const Bounds = require('../intersection/Bounds');
const {setMagnitude, booleanArray, rand, randVector} = require('../util/Number');
const Dust = require('./particle/Dust');
const RectC = require('../painter/RectC');
const Bar = require('../painter/Bar');
const Rect = require('../painter/Rect');

const TARGET_LOCK_BORDER_SIZE = .04;

class Player extends Hero {
	constructor() {
		let abilities = [
			new ProjectileAttack(),
			new Dash(),
			new IncDefense(),
		];
		abilities.forEach((ability, i) => ability.setUi(i));
		let passiveAbilities = [
			new DelayedRegen()
		];

		super(0, 0, .05, .05, 1, 80, .13, IntersectionFinder.Layers.FRIENDLY_UNIT, abilities, passiveAbilities, Colors.LIFE, Colors.STAMINA);
		this.setGraphics(new VShip(this.width, this.height, {fill: true, color: Colors.Entity.PLAYER.get()}));
	}

	update(map, controller, intersectionFinder, monsterKnowledge) {
		this.refresh();
		this.moveControl(controller, intersectionFinder);
		this.abilityControl(map, controller, intersectionFinder);
		this.targetLockControl(controller, intersectionFinder);
		this.createMovementParticle(map); // todo [medium] all heroes should generate movement particles
	}

	moveControl(controller, intersectionFinder) {
		const invSqrt2 = 1 / Math.sqrt(2);

		let left = Keymapping.getControlState(controller, Keymapping.Controls.MOVE_LEFT).active;
		let up = Keymapping.getControlState(controller, Keymapping.Controls.MOVE_UP).active;
		let right = Keymapping.getControlState(controller, Keymapping.Controls.MOVE_RIGHT).active;
		let down = Keymapping.getControlState(controller, Keymapping.Controls.MOVE_DOWN).active;

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

		this.currentMove = [dx, dy];
		this.safeMove(intersectionFinder, dx, dy, .005 * Buff.moveSpeed(this.buffs));
	}

	abilityControl(map, controller, intersectionFinder) {
		let directTarget = this.targetLock || controller.getMouse();
		let direct = {
			x: directTarget.x - this.x,
			y: directTarget.y - this.y
		};
		let activeAbilitiesWanted = this.abilities.map((_, i) =>
			Keymapping.getControlState(controller, Keymapping.Controls.ABILITY_I[i]).active);
		this.updateAbilities(map, intersectionFinder, activeAbilitiesWanted, direct);
	}

	targetLockControl(controller, intersectionFinder) {
		if (this.targetLock && this.targetLock.health.isEmpty())
			this.targetLock = null;

		if (!Keymapping.getControlState(controller, Keymapping.Controls.TARGET_LOCK).pressed)
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

	createMovementParticle(map) {
		const RATE = .2, SIZE = .005, DIRECT_VELOCITY = .003, RAND_VELOCITY = .001;

		if (!booleanArray(this.currentMove) || rand() > RATE)
			return;

		let directv = setMagnitude(...this.currentMove, -DIRECT_VELOCITY);
		let randv = randVector(RAND_VELOCITY);

		map.addParticle(new Dust(this.x, this.y, SIZE, directv.x + randv[0], directv.y + randv[1], 100));
	}

	refresh() {
		super.refresh();
		this.recentDamage.decay();
		this.buffs.forEach((buff, i) => buff.setUiIndex(i));
	}

	changeHealth(amount) {
		super.changeHealth(amount);
		this.recentDamage.add(-amount);
	}

	paintUi(painter, camera) {
		// target lock
		// todo [medium] target lock draws over monster health bar
		if (this.targetLock)
			painter.add(RectC.withCamera(camera, this.targetLock.x, this.targetLock.y,
				this.targetLock.width + TARGET_LOCK_BORDER_SIZE, this.targetLock.height + TARGET_LOCK_BORDER_SIZE,
				{color: Colors.TARGET_LOCK.get(), thickness: 3}));

		// life & stamina bar
		const HEIGHT_WITH_MARGIN = Positions.BAR_HEIGHT + Positions.MARGIN;
		painter.add(new Bar(Positions.PLAYER_BAR_X, 1 - HEIGHT_WITH_MARGIN, 1 - Positions.PLAYER_BAR_X - Positions.MARGIN, Positions.BAR_HEIGHT, this.stamina.getRatio(), Colors.STAMINA.getShade(Colors.BAR_SHADING), Colors.STAMINA.get(), Colors.STAMINA.get(Colors.BAR_SHADING)));
		painter.add(new Bar(Positions.PLAYER_BAR_X, 1 - HEIGHT_WITH_MARGIN * 2, 1 - Positions.PLAYER_BAR_X - Positions.MARGIN, Positions.BAR_HEIGHT, this.health.getRatio(), Colors.LIFE.getShade(Colors.BAR_SHADING), Colors.LIFE.get(), Colors.LIFE.get(Colors.BAR_SHADING)));

		// abilities
		this.abilities.forEach(ability => ability.paintUi(painter, camera));

		// buffs
		this.buffs.forEach(buff => buff.paintUi(painter, camera));

		// damage overlay
		let damageColor = Colors.DAMAGE.getAlpha(this.recentDamage.get());
		painter.add(new Rect(0, 0, 1, 1, {fill: true, color: damageColor}));
	}
}

module.exports = Player;
