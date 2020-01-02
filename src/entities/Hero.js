const LivingEntity = require('./LivingEntity');
const Decay = require('../util/Decay');
const IntersectionFinder = require('../intersection/IntersectionFinder');
const {Colors} = require('../util/Constants');
const Pool = require('../util/Pool');
const BarC = require('../painter/BarC');

class Hero extends LivingEntity {
	constructor(x, y, width, height, health, stamina, staminaRefresh, layer, abilities, passiveAbilities, nameplateLifeColor, nameplateStaminaColor) {
		super(x, y, width, height, health, layer);
		this.stamina = new Pool(stamina, staminaRefresh); // todo [high] consider replacing staminaRefresh with passive ability
		this.abilities = abilities;
		this.passiveAbilities = passiveAbilities;
		this.nameplateLifeColor = nameplateLifeColor;
		this.nameplateStaminaColor = nameplateStaminaColor;
		this.recentDamage = new Decay(.1, .001);
	}

	refresh() {
		super.refresh();
		this.stamina.increment();
	}

	updateAbilities(map, intersectionFinder, activeAbilitiesWanted, direct) {
		this.abilities.forEach((ability, i) =>
			ability.update(this, direct, map, intersectionFinder, this, activeAbilitiesWanted[i]));
		this.passiveAbilities.forEach(ability =>
			ability.update(this, direct, map, intersectionFinder, this, true));
	}

	sufficientStamina(amount) {
		return amount <= this.stamina.get();
	}

	consumeStamina(amount) {
		this.stamina.change(-amount);
	}

	restoreHealth() {
		super.restoreHealth();
		this.stamina.restore();
	}

	paint(painter, camera) {
		super.paint(painter, camera);
		// nameplate life & stamina bar
		painter.add(BarC.withCamera(camera, this.x, this.y - this.height - .02, .15, .02, this.health.getRatio(),
			this.nameplateLifeColor.getShade(Colors.BAR_SHADING), this.nameplateLifeColor.get(), this.nameplateLifeColor.get(Colors.BAR_SHADING)));
		painter.add(BarC.withCamera(camera, this.x, this.y - this.height, .15, .01, this.stamina.getRatio(),
			this.nameplateStaminaColor.getShade(Colors.BAR_SHADING), this.nameplateStaminaColor.get(), this.nameplateStaminaColor.get(Colors.BAR_SHADING)));
	}
}

module.exports = Hero;
