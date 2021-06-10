import Emitter from '../util/Emitter.js';
import SkillItem from './SkillsItem.js';
import Stat from './Stat.js';

class SkillsData extends Emitter {
	constructor() {
		super();
		// UI can fit 32 items.
		this.skillItems = [
			new SkillItem('Life', [
				new Stat(Stat.Ids.LIFE, .05),
			], 0, 4, '+5% max life'),
			new SkillItem('Heavy armor', [
				new Stat(Stat.Ids.ARMOR, .05),
				new Stat(Stat.Ids.MOVE_SPEED, -.05),
			], 0, 4, '+10% armor; -5% move speed'),
		];

		// todo [high] use Pool
		this.level = 0;
		this.exp = 0;
		this.availablePoints = 0;
	}

	get stored() {
		return {
			level: this.level,
			exp: this.exp,
			availablePoints: this.availablePoints,
			skillItems: Object.fromEntries(this.skillItems.map(skillItem =>
				([skillItem.name, skillItem.value]))),
		};
	}

	set stored(stored) {
		this.level = stored?.level || 0;
		this.exp = stored?.exp || 0;
		this.availablePoints = stored?.availablePoints || 0;
		this.skillItems.forEach(skillItem =>
			skillItem.value = stored?.skillItems?.[skillItem.name] || 0);
	}

	get availableText() {
		return `Available skill points: ${this.availablePoints}`;
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

	allocate(skill, value) {
		if (skill.value + value >= 0 && this.availablePoints - value >= 0 && skill.value + value <= skill.maxValue) {
			skill.value += value;
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

export default SkillsData;
