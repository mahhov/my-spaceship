const LivingEntity = require('./LivingEntity');

class Player extends LivingEntity {
	constructor(x, y) {
		super(x, y, .004, .01, '#000', 0);
	}
}


module.exports = Player;
