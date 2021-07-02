import Color from './Color.js';

const Colors = {
	// todo [medium] structure these constants

	// bars
	BAR_SHADING: 1,
	LIFE: Color.fromHexString('#cb584a'),
	STAMINA: Color.fromHexString('#68cd61'),
	EXP: Color.fromHexString('#61b4cd'),
	ENRAGE: Color.fromHexString('#616600'),

	TARGET_LOCK: Color.from1(.5, .5, .5),
	DAMAGE: Color.from255(255, 0, 0, .4),

	// abilities
	PLAYER_ABILITIES: [
		Color.fromHexString('#525050'),
		Color.fromHexString('#525050'),
		Color.fromHexString('#525050'),
		Color.fromHexString('#525050'),
		Color.fromHexString('#525050'),
		Color.fromHexString('#525050'),
	],
	PLAYER_ABILITY_NOT_READY: Color.fromHexString('#aaa'),

	// buffs
	// todo [low] lower case this for consistency
	PLAYER_BUFFS: {
		DEAD: Color.from1(.5, .5, .5),
		DAMAGE_OVER_TIME: Color.fromHexString('3F1358'),
	},

	Interface: {
		INACTIVE: Color.from1(0, 0, 0),
		HOVER: Color.from1(.2, .2, .2),
		ACTIVE: Color.from1(.4, .4, .4),
		DULL_BORDER: Color.fromHexString('#aaa'),
		PRIMARY: Color.fromHexString('#fff'),
		TEXT_BACK: Color.fromHexString('#000'),
	},

	Entity: {
		MAP_BOUNDARY: Color.fromHexString('#0a0a0a'),
		ROCK: Color.fromHexString('#333'),
		ROCK_MINERAL: Color.fromHexString('#353'),
		EGG: Color.fromHexString('#68b'),
		PLAYER: Color.fromHexString('#888'),
		PLAYER_GREEN: Color.fromHexString('#638d59'),
		FRIENDLY: Color.fromHexString('#63bd59'),
		MONSTER: Color.fromHexString('#d5584b'),
		FRIENDLY_PROJECTILE: Color.fromHexString('#6c6'),
		HOSTILE_PROJECTILE: Color.fromHexString('#ef240e'),
		Bomb: {
			WARNING_BORDER: Color.fromHexString('#cc8f52'),
			ENTITY: Color.fromHexString('#3f1358'),
		},
		AREA_DEGEN: {
			WARNING_BORDER: Color.from1(1, 0, 0),
			ACTIVE_FILL: Color.from1(.8, 0, 0, .4),
		},
		DUST: Color.fromHexString('#ccc'),
		DAMAGE_DUST: Color.fromHexString('#f88'),
	},

	Monsters: {
		OutpostPortal: {
			FILL: Color.from1(1, .9, .9),
			BORDER: Color.from1(1, .5, .5),
			LINES: Color.from1(1, .95, .95),
		},
	},

	Star: {
		WHITE: Color.from1(.7, .7, .7),
		BLUE: Color.from1(.5, .5, .75),
	},

	Minimap: {
		BACKGROUND: Color.from1(.2, .2, .2, .5),
		BORDER: Color.from1(0, 0, 0, .5),
		ROCK: Color.from1(0, 0, 0),
		MONSTER: Color.from1(1, 0, 0),
		BOSS: Color.from1(1, 0, .6),
		PLAYER: Color.from1(0, 0, 1),
	},
};

const Positions = {
	MARGIN: .02,
	BAR_HEIGHT: .015,
	PLAYER_BAR_X: .5,
	ABILITY_SIZE: .06,
	ABILITY_CHANNEL_BAR_SIZE: .01,
	BUFF_SIZE: .05,
	STAGE_TEXT_HEIGHT: .03,
	UI_FIRST_ROW: .22,
	UI_ROW_HEIGHT: .05,
	UI_LINE_HEIGHT: .02,
	UI_BUTTON_HEIGHT: .03,
	BREAK: .002,
};

export {Colors, Positions};

// Notes

// SHIELD_COLOR: Color.from1(.4, .5, .7),
// RESERVE_COLOR: Color.from1(.2, .6, .6),
// EXPERIENCE_COLOR: Color.from1(.9, .6, .1),

// LIFE_EMPTY_COLOR: Color.fromHex(0x4, 0xb, 0xc),
// LIFE_FILL_COLOR: Color.fromHex(0x5, 0xd, 0xf),
// STAMINA_EMPTY_COLOR: Color.fromHex(0xc, 0xc, 0x4),
// STAMINA_FILL_COLOR: Color.fromHex(0xf, 0xf, 0x5),

// const localLife = '#cc4e4e';
// const localStamina = '#ffcc99';
// const localShield = '#6680b3';
// const localReserve = '#339999';
// const localExperience = '#e6991a';

// http://paletton.com/#uid=75C0F0kj+zZ9XRtfuIvo0ulsJqf

// todo [low] find prettier colors
