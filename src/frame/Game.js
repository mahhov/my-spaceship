import Frame from './Frame.js';
import GameMenu from './GameMenu.js';
import GameWorld from './GameWorld.js';

class Game extends Frame {
	constructor(controller, painterSet) {
		super(controller, painterSet);
		this.menu = new GameMenu(controller, painterSet);
		this.world = new GameWorld(controller, painterSet);
		this.activeFrame = this.menu;
		this.menu.on('resume', () => this.activeFrame = this.world);
		this.menu.on('begin-encounter', MapGeneratorClass => {
			this.world.reset(MapGeneratorClass);
			this.activeFrame = this.world;
		});
		this.world.on('pause', () => {
			this.menu.pause();
			this.activeFrame = this.menu;
		});
	}

	update() {
		this.activeFrame.update();
	}

	paint() {
		this.activeFrame.paint();
	}
}

export default Game;

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
