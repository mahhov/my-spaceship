import makeEnum from '../util/enum.js';
import {round} from '../util/number.js';
import {enumName, toUiString} from '../util/string.js';

const Ids = makeEnum({
	LIFE: 0,
	LIFE_REGEN: 0,
	LIFE_LEECH: 0,
	STAMINA: 0,
	STAMINA_REGEN: 0,
	STAMINA_GAIN: 0,
	SHIELD: 0,
	SHIELD_REGEN: 0,
	SHIELD_LEECH: 0,
	ARMOR: 0,

	DAMAGE: 0,
	DAMAGE_OVER_TIME: 0,
	COOLDOWN_RATE: 0,
	ATTACK_RANGE: 0,
	CRITICAL_CHANCE: 0,
	CRITICAL_DAMAGE: 0,

	MOVE_SPEED: 0,

	DISABLED: 0,
	TAKING_DAMAGE_OVER_TIME: 0,
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
		return enumName(id, ids);
	}
}

Stat.Ids = Ids;
Stat.DerivedStatIds = DerivedStatIds;

export default Stat;
