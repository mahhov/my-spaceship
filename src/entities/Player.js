const LivingEntity = require('./LivingEntity');
const Color = require('../util/Color');
const {IntersectionFinderLayers} = require('../intersection/IntersectionFinder');
const ProjectileAttack = require('../abilities/ProjectileAttack');
const LaserAttack = require('../abilities/LaserAttack');
const Dash = require('../abilities/Dash');
const Heal = require('../abilities/Heal');
const Decay = require('../util/Decay');
const VShip = require('../graphics/VShip');
const {Keys} = require('../Keymapping');
const {Bounds} = require('../intersection/Bounds');
const {UiCs, UiPs} = require('../UiConstants');
const RectC = require('../painter/RectC');
const Bar = require('../painter/Bar');
const Rect = require('../painter/Rect');

const TARGET_LOCK_BORDER_SIZE = .04;

class Player extends LivingEntity {
	constructor(x, y) {
		super(x, y, .05, .05, .005, Color.fromHex(0x0, 0x0, 0x0, true), IntersectionFinderLayers.FRIENDLY_UNIT);

		this.maxStamina = this.stamina = 100;
		this.abilities = [new ProjectileAttack(0), new Dash(1), new Heal(2)];

		this.recentDamage = new Decay(.1, .001);

		this.ship = new VShip(this.color, this.width, this.height);
	}

	update(logic, controller, keymapping, intersectionFinder) {
		this.refresh();
		this.moveControl(controller, keymapping, intersectionFinder);
		this.abilityControl(logic, controller, keymapping, intersectionFinder);
		this.targetLockControl(logic, controller, keymapping, intersectionFinder);
	}

	refresh() {
		if (this.stamina < this.maxStamina)
			this.stamina = Math.min(this.stamina + .13, this.maxStamina);
	}

	moveControl(controller, keymapping, intersectionFinder) {
		const invSqrt2 = 1 / Math.sqrt(2);

		let left = keymapping.isActive(controller, Keys.MOVE_LEFT);
		let up = keymapping.isActive(controller, Keys.MOVE_UP);
		let right = keymapping.isActive(controller, Keys.MOVE_RIGHT);
		let down = keymapping.isActive(controller, Keys.MOVE_DOWN);

		let dx = 0, dy = 0;

		if (left)
			dx -= 1;
		if (up)
			dy -= 1;
		if (right)
			dx += 1;
		if (down)
			dy += 1;

		if (dx !== 0 && dy !== 0) {
			dx = Math.sign(dx) * invSqrt2;
			dy = Math.sign(dy) * invSqrt2;
		}

		this.moveDirection = [dx, dy];
		this.safeMove(intersectionFinder, dx, dy, this.speed);
	}

	abilityControl(logic, controller, keymapping, intersectionFinder) {
		let directTarget = this.targetLock || controller.getMouse();
		let direct = {
			x: directTarget.x - this.x,
			y: directTarget.y - this.y
		};

		this.abilities
			.forEach((ability, index) => {
				ability.refresh();
				if (keymapping.isActive(controller, Keys.ABILITY_I[index]))
					ability.safeActivate(this, direct, logic, intersectionFinder, this);
			});
	}

	targetLockControl(logic, controller, keymapping, intersectionFinder) {
		if (!keymapping.isPressed(controller, Keys.TARGET_LOCK))
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
		this.targetLock = intersectionFinder.hasIntersection(IntersectionFinderLayers.HOSTILE_UNIT, targetLockBounds);
	}

	sufficientStamina(amount) {
		return amount <= this.stamina;
	}

	consumeStamina(amount) {
		this.stamina -= amount;
	}

	changeHealth(amount) {
		super.changeHealth(amount);
		this.recentDamage.add(-amount);
	}

	paint(painter, camera) {
		this.ship.paint(painter, camera, this.x, this.y, this.moveDirection);
	}

	paintUi(painter, camera) {
		// target lock
		if (this.targetLock)
			painter.add(RectC.withCamera(camera, this.targetLock.x, this.targetLock.y,
				this.targetLock.width + TARGET_LOCK_BORDER_SIZE, this.targetLock.height + TARGET_LOCK_BORDER_SIZE,
				{color: Color.from1(0, 0, 0).get()}));
		// todo use target ui thicker rect

		// life & stamina bar
		const HEIGHT_WITH_MARGIN = UiPs.BAR_HEIGHT + UiPs.MARGIN;
		painter.add(new Bar(UiPs.PLAYER_BAR_X, 1 - HEIGHT_WITH_MARGIN, 1 - UiPs.PLAYER_BAR_X - UiPs.MARGIN, UiPs.BAR_HEIGHT, this.stamina / this.maxStamina, UiCs.STAMINA_COLOR.getShade(), UiCs.STAMINA_COLOR.get(), UiCs.STAMINA_COLOR.getShade()));
		painter.add(new Bar(UiPs.PLAYER_BAR_X, 1 - HEIGHT_WITH_MARGIN * 2, 1 - UiPs.PLAYER_BAR_X - UiPs.MARGIN, UiPs.BAR_HEIGHT, this.currentHealth, UiCs.LIFE_COLOR.getShade(), UiCs.LIFE_COLOR.get(), UiCs.LIFE_COLOR.getShade()));

		// abilities
		this.abilities.forEach(ability => ability.paintUi(painter, camera));

		// damage overlay
		let damageColor = UiCs.DAMAGE_COLOR.getShade(254 * (1 - this.recentDamage.get()));
		painter.add(new Rect(0, 0, 1, 1, {fill: true, color: damageColor}));
	}
}

module.exports = Player;
