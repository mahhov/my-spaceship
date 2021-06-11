import makeEnum from '../util/enum.js';

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

const DerivedStatIds = makeEnum({LIFE: 0});

// Generic class used by techniques, traits, & equipment.
class Stat {
	constructor(id, value) {
		this.id = id;
		this.value = value;
	}

	static name(id) {
		return Stat.keyToName(Object.keys(Ids)[id]);
	}

	static derivedStatName(id) {
		return Stat.keyToName(Object.keys(DerivedStatIds)[id]);
	}

	static keyToName(key) {
		return key[0].toUpperCase() + key.slice(1).toLowerCase().replaceAll('_', ' ');
	}
}

Stat.Ids = Ids;
Stat.DerivedStatIds = DerivedStatIds;

export default Stat;
