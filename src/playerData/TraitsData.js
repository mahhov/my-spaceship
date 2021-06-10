import Emitter from '../util/Emitter.js';
import Stat from './Stat.js';
import TraitItem from './TraitItem.js';

class TraitsData extends Emitter {
	constructor() {
		super();
		// UI can fit 32 items.
		this.traitItems = [
			new TraitItem('Life', [
				new Stat(Stat.Ids.LIFE, .05),
			], 0, 4, '+5% max life'),
			new TraitItem('Heavy armor', [
				new Stat(Stat.Ids.ARMOR, .05),
				new Stat(Stat.Ids.MOVE_SPEED, -.05),
			], 0, 4, '+10% armor; -5% move speed'),
		];

		this.level = 0;
		this.exp = 0;
		this.availablePoints = 0;
	}

	get stored() {
		return {
			level: this.level,
			exp: this.exp,
			availablePoints: this.availablePoints,
			traitItems: Object.fromEntries(this.traitItems.map(traitItem =>
				([traitItem.name, traitItem.value]))),
		};
	}

	set stored(stored) {
		this.level = stored?.level || 0;
		this.exp = stored?.exp || 0;
		this.availablePoints = stored?.availablePoints || 0;
		this.traitItems.forEach(traitItem =>
			traitItem.value = stored?.traitItems?.[traitItem.name] || 0);
	}

	get availableText() {
		return `Available trait points: ${this.availablePoints}`;
	}

	get levelText() {
		return `Level: ${this.level + 1}`;
	}

	get expText() {
		return `Experience: ${this.exp}/${this.expRequired}`;
	}

	get levelExpText() {
		return `(${this.level + 1}) ${this.exp}/${this.expRequired}`;
	}

	allocate(traitItem, value) {
		if (traitItem.value + value >= 0 && this.availablePoints - value >= 0 && traitItem.value + value <= traitItem.maxValue) {
			traitItem.value += value;
			this.availablePoints -= value;
			this.emit('change');
		}
	}

	gainExp(exp) {
		this.exp += exp;
		while (this.exp >= this.expRequired) {
			this.exp -= this.expRequired;
			this.level++;
			this.availablePoints += 4;
		}
		this.emit('change');
	}

	get expRequired() {
		return (this.level + 5) * 100;
	}
}

export default TraitsData;
