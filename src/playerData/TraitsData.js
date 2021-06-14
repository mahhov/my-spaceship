import Emitter from '../util/Emitter.js';
import Stat from './Stat.js';
import Trait from './Trait.js';

class TraitsData extends Emitter {
	constructor(expData) {
		super();
		this.traits = [
			new Trait('Life', [
				new Stat(Stat.Ids.LIFE, .05),
			], 0, 4, '+5% max life'),
			new Trait('Heavy armor', [
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
			traits: Object.fromEntries(this.traits.map(trait =>
				([trait.name, trait.value]))),
		};
	}

	set stored(stored) {
		this.availablePoints = stored?.availablePoints || 0;
		this.traits.forEach(trait =>
			trait.value = stored?.traits?.[trait.name] || 0);
	}

	get availableText() {
		return `Available trait points: ${this.availablePoints}`;
	}

	allocate(trait, value) {
		if (trait.value + value >= 0 && this.availablePoints - value >= 0 && trait.value + value <= trait.maxValue) {
			trait.value += value;
			this.availablePoints -= value;
			this.emit('change');
		}
	}
}

export default TraitsData;
