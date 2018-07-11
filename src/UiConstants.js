const Color = require('./util/Color');

module.exports = {
	LIFE_EMPTY_COLOR: Color.fromHex(0x4, 0xB, 0xC, true),
	LIFE_FILL_COLOR: Color.fromHex(0x5, 0xD, 0xF, true),
	STAMINA_EMPTY_COLOR: Color.fromHex(0xc, 0xc, 0x4, true),
	STAMINA_FILL_COLOR: Color.fromHex(0xf, 0xf, 0x5, true),

	// abilities
	BASIC_ATTACK_COLOR: Color.fromHex(0xa, 0x4, 0x4, true),
	DASH_COLOR: Color.fromHex(0x4, 0xa, 0x4, true),
	HEAL_COLOR: Color.fromHex(0x4, 0x4, 0xa, true),

	// extraced from projectX
	// empty values are multipled by .5
	RESERVE_COLOR: Color.from1(.2, .6, .6), // todo see if look better
	STAMINA_COLOR: Color.from1(1, .8, .6),
	SHIELD_COLOR: Color.from1(.4, .5, .7),
	LIFE_COLOR: Color.from1(.8, .3, .3),
	EXPERIENCE_COLOR: Color.from1(.9, .6, .1),
	BORDER_COLOR: Color.from1(0, 0, 0),
};
