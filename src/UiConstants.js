const Color = require('./util/Color');

const EMPTY_MULT = .5;

const Colors = {
	LIFE_COLOR: Color.from1(.8, .3, .3),
	STAMINA_COLOR: Color.from1(1, .8, .6),

	// abilities
	BASIC_ATTACK_COLOR: Color.fromHex(0xa, 0x4, 0x4, true),
	DASH_COLOR: Color.fromHex(0x4, 0xa, 0x4, true),
	HEAL_COLOR: Color.fromHex(0x4, 0x4, 0xa, true),
};

Colors.LIFE_EMPTY_COLOR = Colors.LIFE_COLOR.multiply(EMPTY_MULT);
Colors.STAMINA_EMPTY_COLOR = Colors.STAMINA_COLOR.multiply(EMPTY_MULT);
Colors.BASIC_ATTACK_EMPTY_COLOR = Colors.BASIC_ATTACK_COLOR.multiply(EMPTY_MULT);
Colors.DASH_EMPTY_COLOR = Colors.DASH_COLOR.multiply(EMPTY_MULT);
Colors.HEAL_EMPTY_COLOR = Colors.HEAL_COLOR.multiply(EMPTY_MULT);

const Positions = {
	MARGIN: .02,
	BAR_HEIGHT: .02
};

module.exports = {UiCs: Colors, UiPs: Positions};

// Notes

// SHIELD_COLOR: Color.from1(.4, .5, .7),
// RESERVE_COLOR: Color.from1(.2, .6, .6),
// EXPERIENCE_COLOR: Color.from1(.9, .6, .1),

// LIFE_EMPTY_COLOR: Color.fromHex(0x4, 0xB, 0xC, true),
// LIFE_FILL_COLOR: Color.fromHex(0x5, 0xD, 0xF, true),
// STAMINA_EMPTY_COLOR: Color.fromHex(0xc, 0xc, 0x4, true),
// STAMINA_FILL_COLOR: Color.fromHex(0xf, 0xf, 0x5, true),

const localLife = "#cc4e4e";
const localStamina = "#ffcc99";
const localShield = "#6680b3";
const localReserve = "#339999";
const localExperience = "#e6991a";

// todo find prettier colors