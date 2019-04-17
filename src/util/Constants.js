const Color = require('./Color');

const Colors = {
	// todo [medium] structure these constants

	// bars
	BAR_SHADING: .25,
	LIFE: Color.fromHexString('#fab9b1').avgWhite(.25),
	STAMINA: Color.fromHexString('#98d494').avgWhite(.4),
	ENRAGE: Color.fromHexString('#616600'),

	TARGET_LOCK: Color.from1(.5, .5, .5),
	DAMAGE: Color.from255(255, 0, 0, .4),

	// abilities
	PLAYER_ABILITIES: [
		Color.fromHexString('#a87676').avgWhite(.4),
		Color.fromHexString('#76a876').avgWhite(.4),
		Color.fromHexString('#7676a8').avgWhite(.4),
		Color.fromHexString('#76a6a6').avgWhite(.4),
		Color.fromHexString('#a676a6').avgWhite(.4),
		Color.fromHexString('#a6a676').avgWhite(.4),
	],
	PLAYER_ABILITY_NOT_READY: Color.fromHexString('#444'),

	Interface: {
		INACTIVE: Color.from1(1, 1, 1),
		HOVER: Color.from1(.95, .95, .95),
		ACTIVE: Color.from1(1, 1, 1)
	},

	Entity: {
		ROCK: Color.fromHexString('#888'),
		ROCK_MINERAL: Color.fromHexString('#8b8'),
		PLAYER: Color.fromHexString('#888'),
		MONSTER: Color.fromHexString('#888'),
		PROJECTILE: Color.fromHexString('#888'),
		Bomb: {
			WARNING_BORDER: Color.fromHexString('#cc8f52'),
			ENTITY: Color.fromHexString('#00c')
		},
		DUST: Color.fromHexString('#888'),
		Damage_DUST: Color.fromHexString('#f88')
	},

	Monsters: {
		OutpostPortal: {
			FILL: Color.from1(1, .9, .9),
			BORDER: Color.from1(1, .5, .5),
			LINES: Color.from1(1, .95, .95),
		}
	},

	Ability: {
		NearybyDegen: {
			WARNING_BORDER: Color.from1(1, 0, 0),
			ACTIVE_FILL: Color.from1(.8, 0, 0, .1)
		}
	},

	Star: {
		WHITE: Color.from1(.5, .5, .5),
		BLUE: Color.from1(.5, .5, .75)
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
	STAGE_TEXT_HEIGHT: .03,
};

module.exports = {Colors, Positions};

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
