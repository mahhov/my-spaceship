import Emitter from '../util/Emitter.js';

class ExpData extends Emitter {
	constructor() {
		super();
		this.level = 0;
		this.exp = 0;
	}

	get stored() {
		return {
			level: this.level,
			exp: this.exp,
		};
	}

	set stored(stored) {
		this.level = stored?.level || 0;
		this.exp = stored?.exp || 0;
	}

	get levelText() {
		return this.level + 1;
	}

	get expText() {
		return `${this.exp}/${this.expRequired}`;
	}

	get levelExpText() {
		return `(${this.levelText}) ${this.expText}`;
	}

	gainExp(exp) {
		if (!exp)
			return;
		this.exp += exp;
		let prevLevel = this.level;
		while (this.exp >= this.expRequired) {
			this.exp -= this.expRequired;
			this.level++;
			this.availableTraitPoints += 4;
		}
		this.emit('change');
		this.emit('change-exp', exp);
		if (this.level !== prevLevel)
			this.emit('change-level', this.level - prevLevel);
	}

	get expRequired() {
		return (this.level + 5) * 100;
	}
}

export default ExpData;
