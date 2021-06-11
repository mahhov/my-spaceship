import Emitter from '../util/Emitter.js';
import Stat from './Stat.js';
import TraitItem from './TraitItem.js';

class TraitsData extends Emitter {
	constructor(expData) {
		super();
		this.traitItems = [
			new TraitItem('Life', [
				new Stat(Stat.Ids.LIFE, .05),
			], 0, 4, '+5% max life'),
			new TraitItem('Heavy armor', [
				new Stat(Stat.Ids.ARMOR, .05),
				new Stat(Stat.Ids.MOVE_SPEED, -.05),
			], 0, 4, '+10% armor; -5% move speed'),
		];

		this.availablePoints = 0;
		expData.on('change-level', change => {
			this.availablePoints += change * 4;
			this.emit('change');
		});
	}

	get stored() {
		return {
			availablePoints: this.availablePoints,
			traitItems: Object.fromEntries(this.traitItems.map(traitItem =>
				([traitItem.name, traitItem.value]))),
		};
	}

	set stored(stored) {
		this.availablePoints = stored?.availablePoints || 0;
		this.traitItems.forEach(traitItem =>
			traitItem.value = stored?.traitItems?.[traitItem.name] || 0);
	}

	get availableText() {
		return `Available trait points: ${this.availablePoints}`;
	}

	allocate(traitItem, value) {
		if (traitItem.value + value >= 0 && this.availablePoints - value >= 0 && traitItem.value + value <= traitItem.maxValue) {
			traitItem.value += value;
			this.availablePoints -= value;
			this.emit('change');
		}
	}
}

export default TraitsData;
