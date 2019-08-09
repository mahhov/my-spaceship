const Pool = require('../util/Pool');
const Keymapping = require('../control/Keymapping');
const {Colors, Positions} = require('../util/Constants');
const Rect = require('../painter/Rect');
const Text = require('../painter/Text');

class Ability {
	constructor(cooldown, charges, stamina, channelStamina, repeatable, channeled) {
		this.cooldown = new Pool(cooldown, -1);
		this.charges = new Pool(charges, 1);
		this.stamina = stamina;
		this.channelStamina = channelStamina;
		this.repeatable = repeatable;
		this.channeled = channeled; // todo [low] allow custom channel duration instead of just true/false
		this.activeDuration = 0; // activeDuration 0 on start, 1... on subsequent calls
	}

	setUi(uiIndex) {
		this.uiIndex = uiIndex;
		this.uiColor = Colors.PLAYER_ABILITIES[uiIndex];
		this.uiText = Keymapping.getKeys(Keymapping.Controls.ABILITY_I[uiIndex]).join('/');
	}

	update(origin, direct, map, intersectionFinder, player, wantActive) {
		this.refresh(player);
		if (wantActive && this.safeActivate(origin, direct, map, intersectionFinder, player))
			this.activeDuration++;
		else if (this.activeDuration !== 0) {
			this.endActivate(origin, direct, map, intersectionFinder, player);
			this.activeDuration = 0;
		}
	}

	refresh(player) {
		if (!this.charges.isFull() && this.cooldown.increment()) {
			this.charges.increment();
			this.cooldown.restore();
		}

		this.ready = !this.charges.isEmpty() && player.sufficientStamina(this.stamina) && (this.repeatable || !this.repeating);
		this.readyChannelContinue = this.channeled && this.cooldown.value === this.cooldown.max - 1 && player.sufficientStamina(this.channelStamina);
		this.repeating = false;
	}

	safeActivate(origin, direct, map, intersectionFinder, player) {
		this.repeating = true;
		if (!this.ready && !this.readyChannelContinue)
			return false;
		if (!this.activate(origin, direct, map, intersectionFinder, player))
			return false;

		if (this.ready) {
			this.charges.change(-1);
			player.consumeStamina(this.stamina);
		} else {
			player.consumeStamina(this.channelStamina);
			this.cooldown.value = this.cooldown.max;
		}
		return true;
	}

	activate(origin, direct, map, intersectionFinder, player) {
		/* override */
	}

	endActivate(origin, direct, map, intersectionFinder, player) {
		/* override */
	}

	paintUi(painter, camera) {
		// background
		const SIZE_WITH_MARGIN = Positions.ABILITY_SIZE + Positions.MARGIN;
		const LEFT = Positions.MARGIN + this.uiIndex * SIZE_WITH_MARGIN, TOP = 1 - SIZE_WITH_MARGIN;
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
		painter.add(new Text(LEFT + Positions.ABILITY_SIZE / 2, TOP + Positions.ABILITY_SIZE / 2, this.uiText));
	}
}

module.exports = Ability;
