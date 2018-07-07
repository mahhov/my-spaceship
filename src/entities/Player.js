const LivingEntity = require('./LivingEntity');
const {IntersectionFinderLayers} = require('../intersection/IntersectionFinder');
const BasicAttack = require('../abilities/BasicAttack');
const Dash = require('../abilities/Dash');
const {Keys} = require('../Keymapping');

class Player extends LivingEntity {
	constructor(x, y) {
		super(x, y, .01, .004, '#000', IntersectionFinderLayers.FRIENDLY_UNIT, 0);

		this.abilities = [new BasicAttack(0), new Dash(1)];
	}

	update(logic, controller, keymapping, intersectionFinder) {
		this.moveControl(controller, keymapping, intersectionFinder);
		this.abilityControl(logic, controller, keymapping);
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

	abilityControl(logic, controller, keymapping) {
		let mouse = controller.getMouse();
		let directX = mouse.x - this.x;
		let directY = mouse.y - this.y;

		this.abilities.forEach((ability, index) => {
			if (keymapping.isActive(controller, Keys.ABILITY_I[index]))
				ability.activate(this.x, this.y, directX, directY, logic);
		});
	}

	paintUi(painter) {
		super.paintUi(painter);
		this.abilities.forEach(ability => ability.paintUi(painter));
	}
}


module.exports = Player;
