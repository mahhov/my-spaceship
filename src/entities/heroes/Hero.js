import IntersectionFinder from '../../intersection/IntersectionFinder.js';
import Bar from '../../painter/elements/Bar.js';
import Stat from '../../playerData/Stat.js';
import {Colors} from '../../util/constants.js';
import Coordinate from '../../util/Coordinate.js';
import Decay from '../../util/Decay.js';
import {booleanArray, rand, randVector, setMagnitude} from '../../util/number.js';
import Pool from '../../util/Pool.js';
import EntityObserver from '../EntityObserver.js';
import LivingEntity from '../LivingEntity.js';
import Dust from '../particles/Dust.js';

class Hero extends LivingEntity {
	constructor(x, y, width, height, baseStats, statValues, friendly, nameplateLifeColor, nameplateStaminaColor) {
		let layer = friendly ? IntersectionFinder.Layers.FRIENDLY_UNIT : IntersectionFinder.Layers.HOSTILE_UNIT;
		super(x, y, width, height, baseStats, statValues, layer);
		this.friendly = friendly;
		this.nameplateLifeColor = nameplateLifeColor;
		this.nameplateStaminaColor = nameplateStaminaColor;
		this.recentDamage = new Decay(.1, .001);
		this.currentMove = [0, 0];
		// todo [medium] consider replacing staminaRefresh with passive ability
		this.stamina = new Pool(this.statManager.getBasedStat(Stat.Ids.STAMINA), this.statManager.getBasedStat(Stat.Ids.STAMINA_REGEN));
	}

	initAbilities(abilities, passiveAbilities) {
		// should be called during initialization
		this.abilities = abilities;
		this.passiveAbilities = passiveAbilities;
	}

	refresh() {
		this.recentDamage.decay();
		this.stamina.increment();

		let staminaGainAmount = this.getQueuedEvents(EntityObserver.EventIds.DEALT_DAMAGE)
			.reduce((sum, [source, damage]) => sum + (damage && source.statManager.getBasedStat(Stat.Ids.STAMINA_GAIN)), 0);
		this.stamina.change(staminaGainAmount);

		super.refresh();
	}

	updateMove(intersectionFinder, dx, dy, magnitude, noSlide) {
		if (this.statManager.getBasedStat(Stat.Ids.DISABLED))
			return;
		this.currentMove = [dx, dy];
		this.safeMove(intersectionFinder, dx, dy, magnitude, noSlide);
	}

	updateAbilities(map, intersectionFinder, activeAbilitiesWanted, direct) {
		let disabled = this.statManager.getBasedStat(Stat.Ids.DISABLED);
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
		return amount <= this.stamina.value;
	}

	consumeStamina(amount) {
		this.stamina.change(-amount);
	}

	takeDamage(amount) {
		this.recentDamage.add(amount / 100);
		return super.takeDamage(amount);
	}

	restoreHealth() {
		super.restoreHealth();
		this.stamina.restore();
	}

	paint(painter, camera) {
		const BAR_WIDTH = .15, LIFE_HEIGHT = .02, STAMINA_HEIGHT = .01, MARGIN = .01;
		super.paint(painter, camera);
		// life bar
		let barTop = this.y - this.height / 2 - LIFE_HEIGHT - STAMINA_HEIGHT - MARGIN - .02;
		let healthCoordinate = new Coordinate(this.x, barTop, BAR_WIDTH, LIFE_HEIGHT).align(Coordinate.Aligns.CENTER, Coordinate.Aligns.START);
		painter.add(new Bar(camera.transformCoordinates(healthCoordinate), this.health.getRatio(), this.nameplateLifeColor.getShade(Colors.BAR_SHADING), this.nameplateLifeColor.get(), this.nameplateLifeColor.get(Colors.BAR_SHADING)));
		// stamina bar
		painter.add(new Bar(camera.transformCoordinates(healthCoordinate.clone.shift(0, 1).size(BAR_WIDTH, STAMINA_HEIGHT)),
			this.stamina.getRatio(), this.nameplateStaminaColor.getShade(Colors.BAR_SHADING), this.nameplateStaminaColor.get(), this.nameplateStaminaColor.get(Colors.BAR_SHADING)));
		// buffs
		let buffSize = LIFE_HEIGHT + STAMINA_HEIGHT;
		this.statManager.buffs
			.filter(buff => buff.visible)
			.forEach((buff, i) => buff.paintAt(painter,
				camera.transformCoordinates(healthCoordinate.clone
					.alignWithoutMove(Coordinate.Aligns.END, Coordinate.Aligns.START)
					.size(buffSize)
					.shift(1, 0)
					.move(MARGIN + (buffSize + MARGIN) * i, 0))));
	}
}

export default Hero;
