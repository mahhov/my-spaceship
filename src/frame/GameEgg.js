import MapGeneratorEgg from '../map/MapGeneratorEgg.js';
import Game from './Game.js';

// todo [medium] rework canvas to avoid having to subclass a frame class just to set a constructor parameter
class GameEgg extends Game {
	constructor(controller, painterSet) {
		super(controller, painterSet, MapGeneratorEgg);
	}
}

export default GameEgg;
