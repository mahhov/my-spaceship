const Color = require('./Color');

const Colors = {
	// bars
	LIFE: Color.fromHexString('#fab9b1'),
	STAMINA: Color.fromHexString('#98d494'),
	ENRAGE: Color.fromHexString('#616600'),

	TARGET_LOCK: Color.from1(.5, .5, .5),
	DAMAGE: Color.from255(255, 0, 0, .4),

	// abilities
	BASIC_ATTACK: Color.fromHexString('#a87676'),
	DASH: Color.fromHexString('#76a876'),
	HEAL: Color.fromHexString('#7676a8'),
	NOT_READY: Color.fromHex(0xf, 0xf, 0xf),

	Interface: {
		INACTIVE: Color.from1(1, 1, 1),
		HOVER: Color.from1(.95, .95, .95),
		ACTIVE: Color.from1(1, 1, 1)
	},

	Entity: {
		ROCK: Color.fromHexString('#888'),
		PLAYER: Color.fromHexString('#888'),
		MONSTER: Color.fromHexString('#888'),
		PROJECTILE: Color.fromHexString('#888'),
		DUST: Color.fromHexString('#888')
	},

	Ability: {
		NearybyDegen: {
			WARNING_BORDER: Color.from1(1, 0, 0),
			ACTIVE_FILL: Color.from1(.8, 0, 0, .1)
		}
	},

	Star: {
		WHITE: Color.WHITE,
		BLUE: Color.from1(.8, .8, 1)
	},

	Minimap: {
		BACKGROUND: Color.from1(1, 1, 1, .5),
		ROCK: Color.from1(0, 0, 0),
		MONSTER: Color.from1(1, 0, 0),
		BOSS: Color.from1(0, 1, 0),
		PLAYER: Color.from1(0, 0, 1)
	}
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

// LIFE_EMPTY_COLOR: Color.fromHex(0x4, 0xb, 0xc),
// LIFE_FILL_COLOR: Color.fromHex(0x5, 0xd, 0xf),
// STAMINA_EMPTY_COLOR: Color.fromHex(0xc, 0xc, 0x4),
// STAMINA_FILL_COLOR: Color.fromHex(0xf, 0xf, 0x5),

// const localLife = "#cc4e4e";
// const localStamina = "#ffcc99";
// const localShield = "#6680b3";
// const localReserve = "#339999";
// const localExperience = "#e6991a";

// http://paletton.com/#uid=75C0F0kj+zZ9XRtfuIvo0ulsJqf

// todo [low] find prettier colors
