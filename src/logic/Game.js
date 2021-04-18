const Logic = require('./Logic');
const GameMenu = require('./GameMenu');
const GameWorld = require('./GameWorld');

class Game extends Logic {
	constructor(controller, painterSet) {
		super(controller, painterSet);
		this.menu = new GameMenu(controller, painterSet);
		this.world = new GameWorld(controller, painterSet);
		this.activeLogic = this.menu;
		this.menu.on('resume', () => this.activeLogic = this.world);
		this.world.on('pause', () => this.activeLogic = this.menu);
	}

	update() {
		this.activeLogic.update();
	}

	paint() {
		this.activeLogic.paint();
	}
}

module.exports = Game;

// todo [graphics]
// textures
// ui interface
// audio

// todo [content]
// map generation i.e. dungeons
// instances with difficulty, monster variety, and dungeon layout
// mob variety
// sector modes
// resources
// crafting & gear
// skill leveling
// classes & abilities

// todo [other]
// chat
// save
// minimap
// consider restructuring packages. src>abilities & src>entities>module r symmetric

// todo [monster]
// skirmersher
// laser, short range raiders
// latchers that reduce max health
// linkers that reduce speed and drain health
// traps
// dots
