const Color = require('./util/Color');

module.exports = {
	LIFE_EMPTY_COLOR: '#4BC', // todo use Color
	LIFE_FILL_COLOR: '#5DF',
	STAMINA_EMPTY_COLOR: '#cc4',
	STAMINA_FILL_COLOR: '#ff5',

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
