import IntersectionFinder from '../../intersection/IntersectionFinder.js';
import BarC from '../../painter/elements/BarC.js';
import {Colors} from '../../util/Constants.js';
import Decay from '../../util/Decay.js';
import {booleanArray, rand, randVector, setMagnitude} from '../../util/number.js';
import Pool from '../../util/Pool.js';
import Buff from '../Buff.js';
import LivingEntity from '../LivingEntity.js';
import Dust from '../particles/Dust.js';

class Hero extends LivingEntity {
	constructor(x, y, width, height, health, stamina, staminaRefresh, friendly, abilities, passiveAbilities, nameplateLifeColor, nameplateStaminaColor) {
		let layer = friendly ? IntersectionFinder.Layers.FRIENDLY_UNIT : IntersectionFinder.Layers.HOSTILE_UNIT;
		super(x, y, width, height, health, layer);
		this.stamina = new Pool(stamina, staminaRefresh); // todo [medium] consider replacing staminaRefresh with passive ability
		this.friendly = friendly;
		this.abilities = abilities;
		this.passiveAbilities = passiveAbilities;
		this.nameplateLifeColor = nameplateLifeColor;
		this.nameplateStaminaColor = nameplateStaminaColor;
		this.recentDamage = new Decay(.1, .001);
		this.currentMove = [0, 0];
	}

	refresh() {
		super.refresh();
		this.recentDamage.decay();
		this.stamina.increment();
	}

	updateMove(intersectionFinder, dx, dy, magnitude, noSlide) {
		if (Buff.disabled(this.buffs))
			return;
		this.currentMove = [dx, dy];
		this.safeMove(intersectionFinder, dx, dy, magnitude, noSlide);
	}

	updateAbilities(map, intersectionFinder, activeAbilitiesWanted, direct) {
		let disabled = Buff.disabled(this.buffs);
		if (!disabled)
			this.abilities.forEach((ability, i) =>
				ability.update(this, direct, map, intersectionFinder, this, activeAbilitiesWanted[i]));
		this.passiveAbilities.forEach(ability => {
			if (!disabled || ability.disabledOk)
				ability.update(this, direct, map, intersectionFinder, this, true);
		});
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

	restoreHealth() {
		super.restoreHealth();
		this.stamina.restore();
	}

	paint(painter, camera) {
		const BAR_WIDTH = .15, LIFE_HEIGHT = .02, STAMINA_HEIGHT = .01, MARGIN = .005;
		super.paint(painter, camera);
		// life bar
		painter.add(BarC.withCamera(camera, this.x, this.y - this.height - (LIFE_HEIGHT + STAMINA_HEIGHT) / 2 - MARGIN, BAR_WIDTH, LIFE_HEIGHT, this.health.getRatio(),
			this.nameplateLifeColor.getShade(Colors.BAR_SHADING), this.nameplateLifeColor.get(), this.nameplateLifeColor.get(Colors.BAR_SHADING)));
		// stamina bar
		painter.add(BarC.withCamera(camera, this.x, this.y - this.height, BAR_WIDTH, STAMINA_HEIGHT, this.stamina.getRatio(),
			this.nameplateStaminaColor.getShade(Colors.BAR_SHADING), this.nameplateStaminaColor.get(), this.nameplateStaminaColor.get(Colors.BAR_SHADING)));
		// buffs
		let buffSize = LIFE_HEIGHT + STAMINA_HEIGHT + MARGIN;
		this.buffs.forEach((buff, i) =>
			buff.paintAt(painter, camera,
				this.x + BAR_WIDTH / 2 + MARGIN + (buffSize + MARGIN) * i,
				this.y - this.height - buffSize + STAMINA_HEIGHT / 2,
				buffSize));
	}
}

export default Hero;
