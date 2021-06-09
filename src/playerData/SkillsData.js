import SkillItem from './SkillsItem.js';
import Stat from './Stat.js';

class SkillsData {
	constructor() {
		this.skillItems = [
			new SkillItem('Life', [
				new Stat(Stat.Ids.LIFE, 5),
			], 0, 4, '+5% max life'),
			new SkillItem('Heavy armor', [
				new Stat(Stat.Ids.ARMOR, 5),
				new Stat(Stat.Ids.MOVE_SPEED, -5),
			], 0, 4, '+10% armor; -5% move speed'),
		];

		// todo [high] accumulate skill points
		this.availablePoints = 4;
		// this.level = 0;
		// this.exp = 0;
	}

	// getStatValueById(id) {
	// 	let skillItem = this.skillItems.find(skillItem => skillItem.stat.id = id);
	// 	return skillItem.stat.value * skillItem.value;
	// }

	get availableText() {
		return `Available Skill Points: ${this.availablePoints}`;
	}

	increase(skill) {
		if (this.availablePoints && skill.value < skill.maxValue) {
			skill.value++;
			this.availablePoints--;
		}
	}

	decrease(skill) {
		if (skill.value) {
			skill.value--;
			this.availablePoints++;
		}
	}

	// gainExp(exp) {
	// 	this.exp += exp;
	// 	while (this.exp >= this.expRequired) {
	// 		this.exp -= this.expRequired;
	// 		this.level++;
	// 		this.availablePoints += 4;
	// 	}
	// }
	//
	// get expRequired() {
	// 	return (this.level + 5) * 100;
	// }
}

export default SkillsData;
