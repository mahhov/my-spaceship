const Color = require('./util/Color');

const Colors = {
	LIFE_COLOR: Color.fromHexString('#FD5F63'),
	STAMINA_COLOR: Color.fromHexString('#57D550'),
	ENRAGE_COLOR: Color.fromHexString('#616600'),

	DAMAGE_COLOR: Color.from255(255, 1, 1, .3),

	// abilities
	BASIC_ATTACK_COLOR: Color.fromHex(0xa, 0x4, 0x4, true),
	DASH_COLOR: Color.fromHex(0x4, 0xa, 0x4, true),
	HEAL_COLOR: Color.fromHex(0x4, 0x4, 0xa, true),
};

const Positions = {
	MARGIN: .02,
	BAR_HEIGHT: .02,
	PLAYER_BAR_X: .5,
	ABILITY_SIZE: .06,
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

// http://paletton.com/#uid=75C0F0kj+zZ9XRtfuIvo0ulsJqf

// todo find prettier colors