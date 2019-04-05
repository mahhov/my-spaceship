const LivingEntity = require('./LivingEntity');
const IntersectionFinder = require('../intersection/IntersectionFinder');
const {Colors, Positions} = require('../util/Constants');
const VShip = require('../graphics/VShip');
const Pool = require('../util/Pool');
const ProjectileAttack = require('../abilities/ProjectileAttack');
const LaserAttack = require('../abilities/LaserAttack');
const Dash = require('../abilities/Dash');
const Heal = require('../abilities/Heal');
const Accelerate = require('../abilities/Accelerate');
const BombAttack = require('../abilities/BombAttack');
const DelayedRegen = require('../abilities/DelayedRegen');
const Decay = require('../util/Decay');
const Keymapping = require('../control/Keymapping');
const Bounds = require('../intersection/Bounds');
const {setMagnitude, booleanArray, rand, randVector} = require('../util/Number');
const Dust = require('./particle/Dust');
const RectC = require('../painter/RectC');
const Bar = require('../painter/Bar');
const Rect = require('../painter/Rect');

const TARGET_LOCK_BORDER_SIZE = .04;

class Player extends LivingEntity {
	constructor() {
		super(0, 0, .05, .05, 1, IntersectionFinder.Layers.FRIENDLY_UNIT);
		this.setGraphics(new VShip(this.width, this.height, {fill: true, color: Colors.Entity.PLAYER.get()}));

		this.stamina = new Pool(100, .13);
		this.abilities = [
			new ProjectileAttack(0),
			new Dash(1),
			new Heal(2),
			new Accelerate(3),
			new BombAttack(4)];

		this.passiveAbilities = [
			new DelayedRegen()];

		this.recentDamage = new Decay(.1, .001);
	}

	update(map, controller, keymapping, intersectionFinder, monsterKnowledge) {
		this.refresh();
		this.moveControl(controller, keymapping, intersectionFinder);
		this.abilityControl(map, controller, keymapping, intersectionFinder);
		this.targetLockControl(controller, keymapping, intersectionFinder);
		this.createMovementParticle(map);
	}

	refresh() {
		this.stamina.increment();
	}

	moveControl(controller, keymapping, intersectionFinder) {
		const invSqrt2 = 1 / Math.sqrt(2);
		const SPEED = .005;

		let left = keymapping.getKeyState(controller, Keymapping.Keys.MOVE_LEFT).active;
		let up = keymapping.getKeyState(controller, Keymapping.Keys.MOVE_UP).active;
		let right = keymapping.getKeyState(controller, Keymapping.Keys.MOVE_RIGHT).active;
		let down = keymapping.getKeyState(controller, Keymapping.Keys.MOVE_DOWN).active;

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
		this.safeMove(intersectionFinder, dx, dy, SPEED);
	}

	abilityControl(map, controller, keymapping, intersectionFinder) {
		let directTarget = this.targetLock || controller.getMouse();
		let direct = {
			x: directTarget.x - this.x,
			y: directTarget.y - this.y
		};

		this.abilities
			.forEach((ability, index) => {
				ability.refresh(this);
				if (keymapping.getKeyState(controller, Keymapping.Keys.ABILITY_I[index]).active)
					ability.safeActivate(this, direct, map, intersectionFinder, this);
			});

		this.passiveAbilities.forEach((ability) => {
			ability.refresh(this);
			ability.safeActivate(this, direct, map, intersectionFinder, this);
		});
	}

	targetLockControl(controller, keymapping, intersectionFinder) {
		if (this.targetLock && this.targetLock.health.isEmpty())
			this.targetLock = null;

		if (!keymapping.getKeyState(controller, Keymapping.Keys.TARGET_LOCK).pressed)
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

	sufficientStamina(amount) {
		return amount <= this.stamina.get();
	}

	consumeStamina(amount) {
		this.stamina.change(-amount);
	}

	changeHealth(amount) {
		super.changeHealth(amount);
		this.recentDamage.add(-amount);
	}

	paintUi(painter, camera) {
		// target lock
		// todo [medium] target lock draws over monster healht bar
		if (this.targetLock)
			painter.add(RectC.withCamera(camera, this.targetLock.x, this.targetLock.y,
				this.targetLock.width + TARGET_LOCK_BORDER_SIZE, this.targetLock.height + TARGET_LOCK_BORDER_SIZE,
				{color: Colors.TARGET_LOCK.get(), thickness: 3}));

		// life & stamina bar
		const HEIGHT_WITH_MARGIN = Positions.BAR_HEIGHT + Positions.MARGIN;
		painter.add(new Bar(Positions.PLAYER_BAR_X, 1 - HEIGHT_WITH_MARGIN, 1 - Positions.PLAYER_BAR_X - Positions.MARGIN, Positions.BAR_HEIGHT, this.stamina.getRatio(), Colors.STAMINA.getShade(Colors.BAR_SHADING), Colors.STAMINA.get(), Colors.STAMINA.getShade(Colors.BAR_SHADING)));
		painter.add(new Bar(Positions.PLAYER_BAR_X, 1 - HEIGHT_WITH_MARGIN * 2, 1 - Positions.PLAYER_BAR_X - Positions.MARGIN, Positions.BAR_HEIGHT, this.health.getRatio(), Colors.LIFE.getShade(Colors.BAR_SHADING), Colors.LIFE.get(), Colors.LIFE.getShade(Colors.BAR_SHADING)));

		// abilities
		this.abilities.forEach(ability => ability.paintUi(painter, camera));

		// damage overlay
		let damageColor = Colors.DAMAGE.getAlpha(this.recentDamage.get());
		painter.add(new Rect(0, 0, 1, 1, {fill: true, color: damageColor}));
	}
}

module.exports = Player;
