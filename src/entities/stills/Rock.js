import Entity from '../Entity.js';
import IntersectionFinder from '../../intersection/IntersectionFinder.js';
import {Colors} from '../../util/Constants.js';
import RockGraphic from '../../graphics/RockGraphic.js';

class Rock extends Entity {
	constructor(x, y, size) {
		super(x, y, size, size, IntersectionFinder.Layers.PASSIVE);
		this.setGraphics(new RockGraphic(size, size, {fill: true, color: Colors.Entity.ROCK.get()}));
	}
}

export default Rock;
