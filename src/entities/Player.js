const LivingEntity = require('./LivingEntity');
const Color = require('../util/Color');
const {IntersectionFinderLayers} = require('../intersection/IntersectionFinder');
const BasicAttack = require('../abilities/BasicAttack');
const Dash = require('../abilities/Dash');
const Heal = require('../abilities/Heal');
const {Keys} = require('../Keymapping');
const WideBar = require('../painter/WideBar');

class Player extends LivingEntity {
	constructor(x, y) {
		super(x, y, .01, .004, Color.fromHex(0x0, 0x0, 0x0, true), IntersectionFinderLayers.FRIENDLY_UNIT, 0);

		this.maxStamina = this.stamina = 100;
		this.abilities = [new BasicAttack(0), new Dash(1), new Heal(2)];
	}

	update(logic, controller, keymapping, intersectionFinder) {
		this.refresh();
		this.moveControl(controller, keymapping, intersectionFinder);
		this.abilityControl(logic, controller, keymapping, intersectionFinder);
	}

	refresh() {
		if (this.stamina < this.maxStamina)
			this.stamina += .02; // todo adjust stamina totoal , consupmtion, and replenish amounts
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

		if (dx === 0 && dy === 0)
			return;

		if (dx !== 0 && dy !== 0) {
			dx = Math.sign(dx) * invSqrt2;
			dy = Math.sign(dy) * invSqrt2;
		}

		this.safeMove(intersectionFinder, dx, dy, this.speed);
	}

	abilityControl(logic, controller, keymapping, intersectionFinder) {
		let mouse = controller.getMouse();
		let directX = mouse.x - this.x;
		let directY = mouse.y - this.y;

		this.abilities
			.forEach((ability, index) => {
				ability.refresh();
				if (keymapping.isActive(controller, Keys.ABILITY_I[index]))
					ability.safeActivate(this.x, this.y, directX, directY, logic, intersectionFinder, this);
			});
	}

	consumeStamina(amount) {
		if (amount > this.stamina)
			return false;
		this.stamina -= amount;
		return true;
	}

	paintUi(painter) {
		super.paintUi(painter);
		painter.add(new WideBar(3, this.stamina / this.maxStamina, '#f66', '#09c', '#f66')); // todo adjust stamina bar colors
		this.abilities.forEach(ability => ability.paintUi(painter));
	}
}

module.exports = Player;
