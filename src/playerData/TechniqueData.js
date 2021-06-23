import ProjectileAttack from '../abilities/ProjectileAttack.js';
import Allocation from './Allocation.js';
import AllocationsData from './AllocationsData.js';
import Stat from './Stat.js';
import TechniqueTree from './TechniqueTree.js';

class TechniqueData extends AllocationsData {
	constructor(expData) {
		super(expData, 1);
		this.trees = [
			TechniqueData.projectileAttackTree,
			TechniqueData.areaAttackTree,
			TechniqueData.dashTree,
			TechniqueData.defenseTree,
		];
	}

	static get projectileAttackTree() {
		return new TechniqueTree('Projectile attack', [
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
				new Allocation('Armor inc', [new Stat(ProjectileAttack.StatIds.ABILITY_SIZE, 1)], 4),
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
	}

	static get areaAttackTree() {
		return new TechniqueTree('Area attack', [
			[
				new Allocation('Area', [], 4),
				new Allocation('Pulsing', [], 4),
				new Allocation('Lingering dot', [], 4),
			],
			[
				new Allocation('Area', [], 4),
				new Allocation('Ring', [], 4),
				new Allocation('Protruding', [], 4),
			],
			[
				new Allocation('Damage', [], 4),
				new Allocation('Aoe', [], 4),
				new Allocation('Cooldown', [], 4),
			],
			[
				new Allocation('Knockback', [], 4),
				new Allocation('Slow', [], 4),
				new Allocation('Armor debuff', [], 4),
			],
		]);
	}

	static get dashTree() {
		return new TechniqueTree('Dash', [
			[
				new Allocation('Dash', [], 4),
				new Allocation('Blink to target', [], 4),
				new Allocation('Teleport', [], 4),
			],
			[
				new Allocation('Haste', [], 4),
				new Allocation('Damage', [], 4),
				new Allocation('Armor', [], 4),
			],
			[
				new Allocation('Damage', [], 4),
				new Allocation('Slow', [], 4),
				new Allocation('Knockback', [], 4),
			],
			[
				new Allocation('Range', [], 4),
				new Allocation('Stamina', [], 4),
				new Allocation('Cooldown', [], 4),
			],
		]);
	}

	static get defenseTree() {
		return new TechniqueTree('Defense', [
			[
				new Allocation('Heal', [], 4),
				new Allocation('Armor', [], 4),
				new Allocation('Heal over time', [], 4),
			],
			[
				new Allocation('Amount', [], 4),
				new Allocation('Duration', [], 4),
				new Allocation('Cooldown', [], 4),
			],
			[
				new Allocation('No stamina', [], 4),
				new Allocation('Auto cast on low health', [], 4),
				new Allocation('Saving from killing blow', [], 4),
			],
		]);
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
