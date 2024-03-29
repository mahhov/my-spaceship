import EntityObserver from '../entities/EntityObserver.js';
import Bar from '../painter/elements/Bar.js';
import Icon from '../painter/elements/Icon.js';
import Rect from '../painter/elements/Rect.js';
import TechniqueData from '../playerData/TechniqueData.js';
import {Colors, Positions} from '../util/constants.js';
import Coordinate from '../util/Coordinate.js';
import Pool from '../util/Pool.js';

class Ability extends EntityObserver {
	constructor(statManager) {
		super();
		this.statManager = statManager;

		this.cooldown = new Pool(this.cooldownDuration, 0);
		this.charges = new Pool(this.maxCharges, 1);
		this.channelDuration = 0; // 0 on start, 1... on subsequent calls
	}

	setUiIndex(uiIndex) {
		this.uiIndex = uiIndex;
		this.uiColor = Colors.PLAYER_ABILITIES[uiIndex];
		return this;
	}

	setUiImageName(imageName) {
		this.imageName = imageName;
		return this;
	}

	update(origin, direct, map, intersectionFinder, hero, wantActive) {
		this.processQueuedEvents(hero);
		this.clearAllQueuedEvents();
		this.refresh(hero);
		if (wantActive && this.safeActivate(origin, direct, map, intersectionFinder, hero))
			this.channelDuration++;
		else if (this.channelDuration !== 0) {
			this.endActivate(origin, direct, map, intersectionFinder, hero);
			this.channelDuration = 0;
		}
	}

	processQueuedEvents(hero) {
	}

	refresh(hero) {
		this.cooldown.setMax(this.cooldownDuration);
		this.charges.setMax(this.maxCharges);
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

	get cooldownDuration() {
		return this.statManager.getBasedStat(TechniqueData.StatIds.TechniqueBase.COOLDOWN_DURATION);
	}

	get maxCharges() {
		return this.statManager.getBasedStat(TechniqueData.StatIds.TechniqueBase.MAX_CHARGES);
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
		const SIZE_WITH_MARGIN = Positions.ABILITY_SIZE + Positions.MARGIN / 2;
		const LEFT = Positions.MARGIN + this.uiIndex * SIZE_WITH_MARGIN;
		const TOP = 1 - SIZE_WITH_MARGIN;

		// foreground for current charges
		const ROW_HEIGHT = Positions.ABILITY_SIZE / this.charges.max;
		const HEIGHT = this.charges.value * ROW_HEIGHT;
		painter.add(new Rect(new Coordinate(LEFT, TOP + Positions.ABILITY_SIZE - HEIGHT, Positions.ABILITY_SIZE, HEIGHT))
			.setOptions({fill: true, color: this.uiColor.get()}));

		// hybrid for current cooldown
		if (!this.cooldown.isFull()) {
			let shade = this.cooldown.getRatio();
			painter.add(new Rect(new Coordinate(LEFT, TOP + Positions.ABILITY_SIZE - HEIGHT - ROW_HEIGHT, Positions.ABILITY_SIZE, ROW_HEIGHT))
				.setOptions({fill: true, color: this.uiColor.getShade(shade)}));
		}

		// background image
		let coordinate = new Coordinate(LEFT, TOP, Positions.ABILITY_SIZE);
		painter.add(new Icon(coordinate.clone, `../../images/techniques/${this.imageName}`));

		// border
		if (!this.ready)
			painter.add(new Rect(coordinate)
				.setOptions({color: Colors.PLAYER_ABILITY_NOT_READY.get(), thickness: 2}));

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
