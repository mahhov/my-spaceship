import makeEnum from '../util/enum.js';
import StatItem from './StatItem.js';

const Types = makeEnum({HULL: 0, CIRCUIT: 0, THRUSTER: 0, TURRET: 0});

class Equipment extends StatItem {
}

Equipment.Types = Types;

export default Equipment;
