import Coordinate from '../../util/Coordinate.js';
import UiText from '../components/UiText.js';
import Ui from './Ui.js';

class StatsUi extends Ui {
	constructor() {
		super();
		this.add(new UiText(new Coordinate(.5, .15).align(Coordinate.Aligns.CENTER), 'Stats').setTextOptions({size: '18px'}));
		this.add(new UiText(new Coordinate(.4, .2), 'Kills...'));
		this.add(new UiText(new Coordinate(.6, .2).align(Coordinate.Aligns.END, Coordinate.Aligns.START), '00000'));
		this.add(new UiText(new Coordinate(.4, .25), 'Time played...'));
		this.add(new UiText(new Coordinate(.6, .25).align(Coordinate.Aligns.END, Coordinate.Aligns.START), '0'));
	}
}

export default StatsUi;
