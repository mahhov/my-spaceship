import ProjectileAttack from '../abilities/ProjectileAttack.js';
import Allocation from './Allocation.js';
import AllocationsData from './AllocationsData.js';
import Stat from './Stat.js';
import TechniqueTree from './TechniqueTree.js';

class TechniqueData extends AllocationsData {
	constructor(expData) {
		super(expData, 1);

		// charges, laser, charged
		// multiple, chain, pierce
		// damage, attack speed, stacking dot
		// life leech %, stamina gain flat, stacking armour for duration
		// proc chance/dmg, aoe on proc, weakness debuff on proc
		// proc chance/dmg, slow on proc, knockback on proc
		// size, range, spread

		let tree = new TechniqueTree('Projectile attack', [
			[
				new Allocation('Charges', [new Stat(ProjectileAttack.StatIds.ABILITY_CHARGES, 1)], 4),
				new Allocation('Laser', [new Stat(ProjectileAttack.StatIds.ABILITY_SIZE, 1)], 4),
				new Allocation('Channel', [new Stat(ProjectileAttack.StatIds.ABILITY_SIZE, 1)], 4),
			],
			[
				new Allocation('Multishot', [new Stat(ProjectileAttack.StatIds.ABILITY_CHARGES, 1)], 4),
				new Allocation('Chain', [new Stat(ProjectileAttack.StatIds.ABILITY_SIZE, 1)], 4),
				new Allocation('Pierce', [new Stat(ProjectileAttack.StatIds.ABILITY_SIZE, 1)], 4),
			],
			[
				new Allocation('Damage', [new Stat(ProjectileAttack.StatIds.ABILITY_CHARGES, 1)], 4),
				new Allocation('Rate', [new Stat(ProjectileAttack.StatIds.ABILITY_CHARGES, 1)], 4),
				new Allocation('Poison', [new Stat(ProjectileAttack.StatIds.ABILITY_SIZE, 1)], 4),
			],
			[
				new Allocation('Life leech', [new Stat(ProjectileAttack.StatIds.ABILITY_CHARGES, 1)], 4),
				new Allocation('Stamina gain', [new Stat(ProjectileAttack.StatIds.ABILITY_CHARGES, 1)], 4),
				new Allocation('Armour inc', [new Stat(ProjectileAttack.StatIds.ABILITY_SIZE, 1)], 4),
			],
			[
				new Allocation('Proc x2', [new Stat(ProjectileAttack.StatIds.ABILITY_CHARGES, 1)], 4),
				new Allocation('Proc area', [new Stat(ProjectileAttack.StatIds.ABILITY_SIZE, 1)], 4),
				new Allocation('Proc debuff', [new Stat(ProjectileAttack.StatIds.ABILITY_SIZE, 1)], 4),
			],
			[
				new Allocation('Proc x2', [new Stat(ProjectileAttack.StatIds.ABILITY_CHARGES, 1)], 4),
				new Allocation('Proc slow', [new Stat(ProjectileAttack.StatIds.ABILITY_CHARGES, 1)], 4),
				new Allocation('Proc knockback', [new Stat(ProjectileAttack.StatIds.ABILITY_SIZE, 1)], 4),
			],
			[
				new Allocation('Size', [new Stat(ProjectileAttack.StatIds.ABILITY_CHARGES, 1)], 4),
				new Allocation('Range', [new Stat(ProjectileAttack.StatIds.ABILITY_SIZE, 1)], 4),
				new Allocation('Spread', [new Stat(ProjectileAttack.StatIds.ABILITY_SIZE, 1)], 4),
			],
		]);

		this.trees = [tree /*tree, tree, tree*/];
	}

	get stored() {
		return {
			availablePoints: this.availablePoints,
			// allocations: Object.fromEntries(this.allocations.map(allocation =>
			// 	([allocation.name, allocation.value]))),
		};
	}

	set stored(stored) {
		this.availablePoints = stored?.availablePoints || 0;
		// this.allocations.forEach(allocation =>
		// 	allocation.value = stored?.allocations?.[allocation.name] || 0);
	}

	allocateNode(node, value) {
		if (node.value + value !== 0 || this.graph.isSubsetConnected([node]))
			super.allocate(node.value, value);
	}
}

export default TechniqueData;
