const LivingEntity = require('./LivingEntity');
const IntersectionFinder = require('../intersection/IntersectionFinder');
const {Colors} = require('../util/Constants');
const Pool = require('../util/Pool');
const BarC = require('../painter/BarC');

class Hero extends LivingEntity {
	constructor(x, y, width, height, health, stamina, staminaRefresh, friendly, abilities, passiveAbilities, nameplateLifeColor, nameplateStaminaColor) {
		super(x, y, width, height, health,
			friendly ? IntersectionFinder.Layers.FRIENDLY_UNIT : IntersectionFinder.Layers.HOSTILE_UNIT);
		this.stamina = new Pool(stamina, staminaRefresh); // todo [high] consider replacing staminaRefresh with passive ability
		this.abilities = abilities;
		this.passiveAbilities = passiveAbilities;
		this.nameplateLifeColor = nameplateLifeColor;
		this.nameplateStaminaColor = nameplateStaminaColor;
	}

	refresh() {
		super.refresh();
		this.stamina.increment();
		this.recentDamage.decay();
		this.buffs.forEach((buff, i) => buff.setUiIndex(i));
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
