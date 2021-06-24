import makeEnum from '../util/enum.js';
import {round} from '../util/number.js';
import {toUiString} from '../util/string.js';

const Ids = makeEnum({
	DISABLED: 0,
	LIFE: 0,
	ARMOR: 0,
	ATTACK_RANGE: 0,
	MOVE_SPEED: 0,
	// LIFE_REGEN: 0,
	// SHIELD: 0,
	// DAMAGE: 0,
	// ATTACK_SPEED: 0,
	// CRITICAL_CHANCE: 0,
	// CRITICAL_DAMAGE: 0,
	// STAMINA: 0,
	// STAMINA_REGEN: 0,
	// MARKSMAN: 0,
	// PUNCTURE: 0,
	// HEAVY_STRIKE: 0,
	// FAR_SHOT: 0,
	// LIFE_LEECH: 0,
	// SHIELD_LEECH: 0,
});

const DerivedStatIds = makeEnum({TOTAL_LIFE: 0});

// Generic class used by techniques, traits, & equipment.
class Stat {
	constructor(id, value) {
		this.id = id;
		this.value = value;
	}

	getDescriptionText(ids = Ids) {
		return toUiString(`${this.value >= 0 ? '+' : ''}${round(this.value * 100)}% ${Stat.name(this.id, ids)}`);
	}

	static name(id, ids = Ids) {
		return toUiString(Object.keys(ids)[id]);
	}
}

Stat.Ids = Ids;
Stat.DerivedStatIds = DerivedStatIds;

export default Stat;
