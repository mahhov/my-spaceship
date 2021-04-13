const Pool = require('../util/Pool');
const Keymapping = require('../control/Keymapping');
const {Colors, Positions} = require('../util/Constants');
const Rect = require('../painter/Rect');
const Text = require('../painter/Text');
const Bar = require('../painter/Bar');

class Ability {
	constructor(cooldown, charges, stamina, channelStamina, repeatable, channelDuration) {
		this.cooldown = new Pool(cooldown, -1);
		this.charges = new Pool(charges, 1);
		this.stamina = stamina;
		this.channelStamina = channelStamina;
		this.repeatable = repeatable;
		// todo [low] allow indicating whether channel will force stop upon reaching max or will allow to continue
		this.maxChannelDuration = channelDuration; // -1 indicates infinite, 0 indicates 1 tick (i.e. not channeled)
		this.channelDuration = 0; // 0 on start, 1... on subsequent calls
	}

	setUi(uiIndex) {
		this.uiIndex = uiIndex;
		this.uiColor = Colors.PLAYER_ABILITIES[uiIndex];
		this.uiTexts = Keymapping.getString(Keymapping.Controls.ABILITY_I[uiIndex]);
	}

	update(origin, direct, map, intersectionFinder, hero, wantActive) {
		this.refresh(hero);
		if (wantActive && this.safeActivate(origin, direct, map, intersectionFinder, hero))
			this.channelDuration++;
		else if (this.channelDuration !== 0) {
			this.endActivate(origin, direct, map, intersectionFinder, hero);
			this.channelDuration = 0;
		}
	}

	refresh(hero) {
		if (!this.charges.isFull() && this.cooldown.increment()) {
			this.charges.increment();
			this.cooldown.restore();
		}

		this.ready = !this.charges.isEmpty() && hero.sufficientStamina(this.stamina) && (this.repeatable || !this.repeating);
		this.readyChannelContinue = this.maxChannelDuration && this.channelDuration && hero.sufficientStamina(this.channelStamina);
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
			hero.consumeStamina(this.stamina);
		} else {
			hero.consumeStamina(this.channelStamina);
			this.cooldown.value = this.cooldown.max;
		}
		return true;
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
		const SIZE_WITH_MARGIN = Positions.ABILITY_SIZE + Positions.MARGIN;
		const LEFT = Positions.MARGIN + this.uiIndex * SIZE_WITH_MARGIN;
		const TOP = 1 - SIZE_WITH_MARGIN;
		painter.add(new Rect(LEFT, TOP, Positions.ABILITY_SIZE, Positions.ABILITY_SIZE, {fill: true, color: this.uiColor.getShade()}));

		// foreground for current charges
		const ROW_HEIGHT = Positions.ABILITY_SIZE / this.charges.getMax();
		const HEIGHT = this.charges.get() * ROW_HEIGHT;
		painter.add(new Rect(LEFT, TOP + Positions.ABILITY_SIZE - HEIGHT, Positions.ABILITY_SIZE, HEIGHT, {fill: true, color: this.uiColor.get()}));

		// hybrid for current cooldown
		if (!this.cooldown.isFull()) {
			let shade = this.cooldown.getRatio();
			painter.add(new Rect(LEFT, TOP + Positions.ABILITY_SIZE - HEIGHT - ROW_HEIGHT, Positions.ABILITY_SIZE, ROW_HEIGHT, {fill: true, color: this.uiColor.getShade(shade)}));
		}

		// border
		if (!this.ready)
			painter.add(new Rect(LEFT, TOP, Positions.ABILITY_SIZE, Positions.ABILITY_SIZE, {color: Colors.PLAYER_ABILITY_NOT_READY.get(), thickness: 2}));

		// letter
		this.uiTexts.forEach((uiText, i) =>
			painter.add(new Text(
				LEFT + Positions.ABILITY_SIZE / 2,
				TOP + Positions.ABILITY_SIZE / 2 + i * Positions.ABILITY_SIZE / 4,
				uiText, {size: '12px'})));

		// channel bar
		let channelRatio = this.channelRatio;
		if (channelRatio)
			painter.add(new Bar(LEFT, TOP - Positions.ABILITY_CHANNEL_BAR_SIZE - Positions.MARGIN / 2,
				Positions.ABILITY_SIZE, Positions.ABILITY_CHANNEL_BAR_SIZE, channelRatio,
				this.uiColor.getShade(Colors.BAR_SHADING), this.uiColor.get(), this.uiColor.get()))
	}
}

module.exports = Ability;
