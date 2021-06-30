import keyMappings from '../control/keyMappings.js';
import EntityObserver from '../entities/EntityObserver.js';
import Bar from '../painter/elements/Bar.js';
import Rect from '../painter/elements/Rect.js';
import Text from '../painter/elements/Text.js';
import TechniqueData from '../playerData/TechniqueData.js';
import {Colors, Positions} from '../util/constants.js';
import Coordinate from '../util/Coordinate.js';
import Pool from '../util/Pool.js';

class Ability extends EntityObserver {
	constructor(name, statManager) {
		super();
		this.name = name;
		this.statManager = statManager;

		this.cooldown = new Pool(1, 0);
		this.charges = new Pool(statManager.getBasedStat(TechniqueData.StatIds.TechniqueBase.MAX_CHARGES), 1);
		this.channelDuration = 0; // 0 on start, 1... on subsequent calls
	}

	setUi(uiIndex) {
		this.uiIndex = uiIndex;
		this.uiColor = Colors.PLAYER_ABILITIES[uiIndex];
		this.uiTexts = [this.name, keyMappings.ABILITY_I[uiIndex].string[0]];
	}

	update(origin, direct, map, intersectionFinder, hero, wantActive) {
		this.observe(hero);
		this.clearAllQueuedEvents();
		this.refresh(hero);
		if (wantActive && this.safeActivate(origin, direct, map, intersectionFinder, hero))
			this.channelDuration++;
		else if (this.channelDuration !== 0) {
			this.endActivate(origin, direct, map, intersectionFinder, hero);
			this.channelDuration = 0;
		}
	}

	observe(hero) {
	}

	refresh(hero) {
		if (!this.charges.isFull() && this.cooldown.change(-this.cooldownRate)) {
			this.charges.increment();
			this.cooldown.restore();
		}

		this.ready = !this.charges.isEmpty() && hero.sufficientStamina(this.staminaCost) && (this.repeatable || !this.repeating);
		this.readyChannelContinue = this.maxChannelDuration && this.channelDuration && hero.sufficientStamina(this.channelStaminaCost);
		this.repeating = false;
	}

	safeActivate(origin, direct, map, intersectionFinder, hero) {
		this.repeating = true;
		if (!this.ready && !this.readyChannelContinue)
			return false;
		if (!this.activate(origin, direct, map, intersectionFinder, hero))
			return false;

		if (this.ready) {
			this.charges.change(-1);
			hero.consumeStamina(this.staminaCost);
		} else {
			hero.consumeStamina(this.channelStaminaCost);
			this.cooldown.restore();
		}
		return true;
	}

	get cooldownRate() {
		return this.statManager.getBasedStat(TechniqueData.StatIds.TechniqueBase.COOLDOWN_RATE);
	}

	get staminaCost() {
		return this.statManager.getBasedStat(TechniqueData.StatIds.TechniqueBase.STAMINA_COST);
	}

	get channelStaminaCost() {
		return this.statManager.getBasedStat(TechniqueData.StatIds.TechniqueBase.CHANNEL_STAMINA_COST);
	}

	get maxChannelDuration() {
		// todo [low] allow indicating whether channel will force stop upon reaching max or will allow to continue
		// channel duration: -1 indicates infinite, 0 indicates 1 tick (i.e. not channeled)
		return this.statManager.getBasedStat(TechniqueData.StatIds.TechniqueBase.CHANNEL_DURATION);
	}

	get repeatable() {
		return this.statManager.getBasedStat(TechniqueData.StatIds.TechniqueBase.REPEATABLE);
	}

	activate(origin, direct, map, intersectionFinder, hero) {
		/* override */
	}

	endActivate(origin, direct, map, intersectionFinder, hero) {
		/* override */
	}

	get channelRatio() {
		if (this.maxChannelDuration > 0 && this.channelDuration > 0)
			return Math.min(this.channelDuration / this.maxChannelDuration, 1);
	}

	paintUi(painter, camera) {
		// background
		const SIZE_WITH_MARGIN = Positions.ABILITY_SIZE + Positions.MARGIN / 2;
		const LEFT = Positions.MARGIN + this.uiIndex * SIZE_WITH_MARGIN;
		const TOP = 1 - SIZE_WITH_MARGIN;
		painter.add(new Rect(new Coordinate(LEFT, TOP, Positions.ABILITY_SIZE)).setOptions({fill: true, color: this.uiColor.getShade(.5)}));

		// foreground for current charges
		const ROW_HEIGHT = Positions.ABILITY_SIZE / this.charges.getMax();
		const HEIGHT = this.charges.get() * ROW_HEIGHT;
		painter.add(new Rect(new Coordinate(LEFT, TOP + Positions.ABILITY_SIZE - HEIGHT, Positions.ABILITY_SIZE, HEIGHT))
			.setOptions({fill: true, color: this.uiColor.get()}));

		// hybrid for current cooldown
		if (!this.cooldown.isFull()) {
			let shade = this.cooldown.getRatio();
			painter.add(new Rect(new Coordinate(LEFT, TOP + Positions.ABILITY_SIZE - HEIGHT - ROW_HEIGHT, Positions.ABILITY_SIZE, ROW_HEIGHT))
				.setOptions({fill: true, color: this.uiColor.getShade(shade)}));
		}

		// border
		if (!this.ready)
			painter.add(new Rect(new Coordinate(LEFT, TOP, Positions.ABILITY_SIZE))
				.setOptions({color: Colors.PLAYER_ABILITY_NOT_READY.get(), thickness: 2}));

		// text
		this.uiTexts.forEach((uiText, i) =>
			painter.add(new Text(
				new Coordinate(LEFT, TOP, Positions.ABILITY_SIZE).alignWithoutMove(Coordinate.Aligns.CENTER, Coordinate.Aligns.CENTER).shift(0, (i - .5) / 4),
				uiText)
				.setOptions({size: '12px'})));

		// channel bar
		let channelRatio = this.channelRatio;
		if (channelRatio)
			painter.add(new Bar(
				new Coordinate(
					LEFT,
					TOP - Positions.ABILITY_CHANNEL_BAR_SIZE - Positions.MARGIN / 2,
					Positions.ABILITY_SIZE,
					Positions.ABILITY_CHANNEL_BAR_SIZE),
				channelRatio, this.uiColor.getShade(Colors.BAR_SHADING), this.uiColor.get(), this.uiColor.get()));
	}
}

export default Ability;
