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
const Bar = require('../painter/Bar');
const Rect = require('../painter/Rect');

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
		const CLICK_HSIZE = .02;

		if (!keymapping.isActive(controller, Keys.TARGET_LOCK))
			return;

		if (this.targetLock) {
			console.log('unlocked'); // todo remove when locking complete
			this.targetLock = null;
		}

		let mouse = controller.getMouse();
		this.targetLock = intersectionFinder.hasIntersection(IntersectionFinderLayers.HOSTILE_UNIT, new Bounds(mouse.x - CLICK_HSIZE, mouse.y - CLICK_HSIZE, mouse.x + CLICK_HSIZE, mouse.y + CLICK_HSIZE));
		if (this.targetLock)
			console.log('locked', this.targetLock); // todo remove when locking complete
		else
			console.log('no lock target found'); // todo remove when locking complete
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

	paintUi(painter) {
		const HEIGHT_WITH_MARGIN = UiPs.BAR_HEIGHT + UiPs.MARGIN;
		painter.add(new Bar(UiPs.PLAYER_BAR_X, 1 - HEIGHT_WITH_MARGIN, 1 - UiPs.PLAYER_BAR_X - UiPs.MARGIN, UiPs.BAR_HEIGHT, this.stamina / this.maxStamina, UiCs.STAMINA_COLOR.getShade(), UiCs.STAMINA_COLOR.get(), UiCs.STAMINA_COLOR.getShade()));
		painter.add(new Bar(UiPs.PLAYER_BAR_X, 1 - HEIGHT_WITH_MARGIN * 2, 1 - UiPs.PLAYER_BAR_X - UiPs.MARGIN, UiPs.BAR_HEIGHT, this.currentHealth, UiCs.LIFE_COLOR.getShade(), UiCs.LIFE_COLOR.get(), UiCs.LIFE_COLOR.getShade()));

		this.abilities.forEach(ability => ability.paintUi(painter));

		let damageColor = UiCs.DAMAGE_COLOR.getShade(254 * (1 - this.recentDamage.get()));
		painter.add(new Rect(0, 0, 1, 1, damageColor, true));
	}
}

module.exports = Player;
