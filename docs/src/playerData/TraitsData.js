import Allocation from './Allocation.js';
import AllocationsData from './AllocationsData.js';
import Stat from './Stat.js';

class TraitsData extends AllocationsData {
	constructor(expData) {
		super(expData, 4);
		this.allocations = [
			new Allocation('Life', [
				new Stat(Stat.Ids.LIFE, .05),
			], 6).setImageName('health-normal.png'),
			new Allocation('Damage', [
				new Stat(Stat.Ids.DAMAGE, .05),
			], 6).setImageName('hypersonic-bolt.png'),
			new Allocation('Heavy', [
				new Stat(Stat.Ids.ARMOR, .1),
				new Stat(Stat.Ids.MOVE_SPEED, -.05),
			], 6).setImageName('barbute.png'),
			new Allocation('Vitality', [
				new Stat(Stat.Ids.LIFE_REGEN, .1),
				new Stat(Stat.Ids.STAMINA_REGEN, .1),
			], 6).setImageName('caduceus.png'),
			new Allocation('Rage', [
				new Stat(Stat.Ids.ATTACK_SPEED, .1),
				new Stat(Stat.Ids.ARMOR, -.05),
			], 6).setImageName('angry-eyes.png'),
			new Allocation('Virulent', [
				new Stat(Stat.Ids.DAMAGE_OVER_TIME, .1),
			], 6).setImageName('poison-gas.png'),
			new Allocation('Sacrificing', [
				new Stat(Stat.Ids.DAMAGE, .1),
				new Stat(Stat.Ids.LIFE, -.05),
			], 6).setImageName('bleeding-eye.png'),
			new Allocation('Sharpshooter', [
				new Stat(Stat.Ids.ATTACK_RANGE, .1),
				new Stat(Stat.Ids.ATTACK_SPEED, -.05),
			], 6).setImageName('binoculars.png'),
			new Allocation('Overdrive', [
				new Stat(Stat.Ids.SHIELD_DELAY, .1),
				new Stat(Stat.Ids.STAMINA_REGEN, -.05),
			], 6).setImageName('slashed-shield.png'),
			new Allocation('Assassin', [
				new Stat(Stat.Ids.CRITICAL_CHANCE, .1),
				new Stat(Stat.Ids.STAMINA, -.05),
			], 6).setImageName('assassin-pocket.png'),
			new Allocation('Annihilation', [
				new Stat(Stat.Ids.CRITICAL_DAMAGE, .1),
				new Stat(Stat.Ids.ATTACK_RANGE, -.05),
			], 6).setImageName('pierced-heart.png'),
			new Allocation('Cruel', [
				new Stat(Stat.Ids.LIFE_LEECH, .1),
				new Stat(Stat.Ids.LIFE_REGEN, -.05),
			], 6).setImageName('vampire-dracula.png'),
			new Allocation('Resilient', [
				new Stat(Stat.Ids.SHIELD, .1),
				new Stat(Stat.Ids.DAMAGE_OVER_TIME, -.05),
			], 6).setImageName('healing-shield.png'),
			new Allocation('Envious', [
				new Stat(Stat.Ids.SHIELD_LEECH, .1),
				new Stat(Stat.Ids.SHIELD_DELAY, -.05),
			], 6).setImageName('healing-shield.png'),
			new Allocation('Persistent', [
				new Stat(Stat.Ids.STAMINA, .1),
				new Stat(Stat.Ids.DAMAGE, -.05),
			], 6).setImageName('battery-pack-alt.png'),
			new Allocation('Nimble', [
				new Stat(Stat.Ids.MOVE_SPEED, .1),
				new Stat(Stat.Ids.CRITICAL_DAMAGE, -.05),
			], 6).setImageName('fast-arrow.png'),
			new Allocation('The Brute', [
				new Stat(Stat.Ids.LIFE, .1),
				new Stat(Stat.Ids.ARMOR, .1),
				new Stat(Stat.Ids.DAMAGE, .1),
				new Stat(Stat.Ids.STAMINA, -.05),
				new Stat(Stat.Ids.SHIELD, -.05),
				new Stat(Stat.Ids.ATTACK_SPEED, -.05),
			], 6).setImageName('brute.png'),
			new Allocation('The Divine', [
				new Stat(Stat.Ids.SHIELD, .1),
				new Stat(Stat.Ids.SHIELD_DELAY, .1),
				new Stat(Stat.Ids.ATTACK_RANGE, .1),
				new Stat(Stat.Ids.LIFE_LEECH, -.05),
				new Stat(Stat.Ids.DAMAGE_OVER_TIME, -.05),
				new Stat(Stat.Ids.CRITICAL_CHANCE, -.05),
			], 6).setImageName('angel-wings.png'),
			new Allocation('The Nefarious', [
				new Stat(Stat.Ids.DAMAGE_OVER_TIME, .1),
				new Stat(Stat.Ids.CRITICAL_CHANCE, .1),
				new Stat(Stat.Ids.CRITICAL_DAMAGE, .1),
				new Stat(Stat.Ids.ARMOR, -.05),
				new Stat(Stat.Ids.ATTACK_RANGE, -.05),
				new Stat(Stat.Ids.DAMAGE, -.05),
			], 6).setImageName('ifrit.png'),
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
