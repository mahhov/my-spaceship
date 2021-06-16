import makeEnum from '../util/enum.js';
import StatItem from './StatItem.js';

const Types = makeEnum({A: 0});

class Material extends StatItem {
}

Material.Types = Types;

export default Material;
