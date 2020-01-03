const Game = require('./Game');
const MapGeneratorEgg = require('../map/MapGeneratorEgg');

// todo [medium] rework canvas to avoid having to subclass a logic class just to set a constructor parameter
class GameEgg extends Game {
	constructor(controller, painterSet) {
		super(controller, painterSet, MapGeneratorEgg);
	}
}

module.exports = GameEgg;
