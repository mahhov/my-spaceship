import Allocation from './Allocation.js';
import AllocationsData from './AllocationsData.js';
import Stat from './Stat.js';

class TraitsData extends AllocationsData {
	constructor(expData) {
		super(expData, 4);
		this.allocations = [
			new Allocation('Life', [
				new Stat(Stat.Ids.LIFE, .06),
			], 4),
			new Allocation('Heavy', [
				new Stat(Stat.Ids.ARMOR, .06),
				new Stat(Stat.Ids.MOVE_SPEED, -.03),
			], 4),
			new Allocation('Vitality', [
				new Stat(Stat.Ids.LIFE_REGEN, .06),
				new Stat(Stat.Ids.STAMINA_REGEN, .06),
			], 4),
			new Allocation('Rage', [
				new Stat(Stat.Ids.ATTACK_SPEED, .06),
				new Stat(Stat.Ids.ARMOR, -.03),
			], 4),
			new Allocation('Virulent', [
				new Stat(Stat.Ids.DAMAGE_OVER_TIME, .06),
			], 4),
			new Allocation('Sacrificing', [
				new Stat(Stat.Ids.DAMAGE, .06),
				new Stat(Stat.Ids.LIFE, -.03),
			], 4),
			new Allocation('Sharpshooter', [
				new Stat(Stat.Ids.ATTACK_RANGE, .06),
				new Stat(Stat.Ids.ATTACK_SPEED, -.03),
			], 4),
			new Allocation('Overdrive', [
				new Stat(Stat.Ids.SHIELD_DELAY, .06),
				new Stat(Stat.Ids.STAMINA_REGEN, -.03),
			], 4),
			new Allocation('Assassin', [
				new Stat(Stat.Ids.CRITICAL_CHANCE, .06),
				new Stat(Stat.Ids.STAMINA, -.03),
			], 4),
			new Allocation('Annihilation', [
				new Stat(Stat.Ids.CRITICAL_DAMAGE, .06),
				new Stat(Stat.Ids.ATTACK_RANGE, -.03),
			], 4),
			new Allocation('Cruel', [
				new Stat(Stat.Ids.LIFE_LEECH, .06),
				new Stat(Stat.Ids.LIFE_REGEN, -.03),
			], 4),
			new Allocation('Resilient', [
				new Stat(Stat.Ids.SHIELD, .06),
				new Stat(Stat.Ids.DAMAGE_OVER_TIME, -.03),
			], 4),
			new Allocation('Envious', [
				new Stat(Stat.Ids.SHIELD_LEECH, .06),
				new Stat(Stat.Ids.SHIELD_DELAY, -.03),
			], 4),
			new Allocation('Persistent', [
				new Stat(Stat.Ids.STAMINA, .06),
				new Stat(Stat.Ids.DAMAGE, -.03),
			], 4),
			new Allocation('Nimble', [
				new Stat(Stat.Ids.MOVE_SPEED, .06),
				new Stat(Stat.Ids.CRITICAL_DAMAGE, -.03),
			], 4),
			new Allocation('The Brute', [
				new Stat(Stat.Ids.LIFE, .06),
				new Stat(Stat.Ids.ARMOR, .06),
				new Stat(Stat.Ids.DAMAGE, .06),
				new Stat(Stat.Ids.STAMINA, -.03),
				new Stat(Stat.Ids.SHIELD, -.03),
				new Stat(Stat.Ids.ATTACK_SPEED, -.03),
			], 4),
			new Allocation('The Divine', [
				new Stat(Stat.Ids.SHIELD, .06),
				new Stat(Stat.Ids.SHIELD_DELAY, .06),
				new Stat(Stat.Ids.ATTACK_RANGE, .06),
				new Stat(Stat.Ids.LIFE_LEECH, -.03),
				new Stat(Stat.Ids.DAMAGE_OVER_TIME, -.03),
				new Stat(Stat.Ids.CRITICAL_CHANCE, -.03),
			], 4),
			new Allocation('The Nefarious', [
				new Stat(Stat.Ids.DAMAGE_OVER_TIME, .06),
				new Stat(Stat.Ids.CRITICAL_CHANCE, .06),
				new Stat(Stat.Ids.CRITICAL_DAMAGE, .06),
				new Stat(Stat.Ids.ARMOR, -.03),
				new Stat(Stat.Ids.ATTACK_RANGE, -.03),
				new Stat(Stat.Ids.DAMAGE, -.03),
			], 4),
		];
	}

	get stored() {
		return {
			availablePoints: this.availablePoints,
			allocations: Object.fromEntries(this.allocations.map(allocation =>
				([allocation.name, allocation.value]))),
		};
	}

	set stored(stored) {
		this.availablePoints = stored?.availablePoints || 0;
		this.allocations.forEach(allocation =>
			allocation.value = stored?.allocations?.[allocation.name] || 0);
	}
}

export default TraitsData;
