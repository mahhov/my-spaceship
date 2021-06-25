import makeEnum from '../util/enum.js';
import Allocation from './Allocation.js';
import AllocationsData from './AllocationsData.js';
import Stat from './Stat.js';
import TechniqueTree from './TechniqueTree.js';

const StatIds = {
	ProjectileAttack: makeEnum({
		...Stat.Ids,
		ABILITY_CHARGES: 0,
		ABILITY_SIZE: 0,
	}),
};

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
		return new TechniqueTree(TechniqueTree.Ids.PROJECTILE_ATTACK, [
			[
				new Allocation('Charges', [new Stat(StatIds.ProjectileAttack.ABILITY_CHARGES, 1)], 4, 'yo!, dis iz rally cul'),
				new Allocation('Laser', [new Stat(StatIds.ProjectileAttack.ABILITY_SIZE, 1)], 4),
				new Allocation('Channel', [new Stat(StatIds.ProjectileAttack.ABILITY_SIZE, 1)], 4),
			],
			[
				new Allocation('Multishot', [new Stat(StatIds.ProjectileAttack.ABILITY_CHARGES, 1)], 4),
				new Allocation('Chain', [new Stat(StatIds.ProjectileAttack.ABILITY_SIZE, 1)], 4),
				new Allocation('Pierce', [new Stat(StatIds.ProjectileAttack.ABILITY_SIZE, 1)], 4),
			],
			[
				new Allocation('Damage', [new Stat(StatIds.ProjectileAttack.ABILITY_CHARGES, 1)], 4),
				new Allocation('Rate', [new Stat(StatIds.ProjectileAttack.ABILITY_CHARGES, 1)], 4),
				new Allocation('Poison', [new Stat(StatIds.ProjectileAttack.ABILITY_SIZE, 1)], 4),
			],
			[
				new Allocation('Life leech', [new Stat(StatIds.ProjectileAttack.ABILITY_CHARGES, 1)], 4),
				new Allocation('Stamina gain', [new Stat(StatIds.ProjectileAttack.ABILITY_CHARGES, 1)], 4),
				new Allocation('Armor inc', [new Stat(StatIds.ProjectileAttack.ABILITY_SIZE, 1)], 4),
			],
			[
				new Allocation('Proc x2', [new Stat(StatIds.ProjectileAttack.ABILITY_CHARGES, 1)], 4),
				new Allocation('Proc area', [new Stat(StatIds.ProjectileAttack.ABILITY_SIZE, 1)], 4),
				new Allocation('Proc debuff', [new Stat(StatIds.ProjectileAttack.ABILITY_SIZE, 1)], 4),
			],
			[
				new Allocation('Proc x2', [new Stat(StatIds.ProjectileAttack.ABILITY_CHARGES, 1)], 4),
				new Allocation('Proc slow', [new Stat(StatIds.ProjectileAttack.ABILITY_CHARGES, 1)], 4),
				new Allocation('Proc knockback', [new Stat(StatIds.ProjectileAttack.ABILITY_SIZE, 1)], 4),
			],
			[
				new Allocation('Size', [new Stat(StatIds.ProjectileAttack.ABILITY_CHARGES, 1)], 4),
				new Allocation('Range', [new Stat(StatIds.ProjectileAttack.ABILITY_SIZE, 1)], 4),
				new Allocation('Spread', [new Stat(StatIds.ProjectileAttack.ABILITY_SIZE, 1)], 4),
			],
		]);
	}

	static get areaAttackTree() {
		return new TechniqueTree(TechniqueTree.Ids.AREA_ATTACK, [
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
		return new TechniqueTree(TechniqueTree.Ids.DASH, [
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
		return new TechniqueTree(TechniqueTree.Ids.DEFENSE, [
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
			// todo [medium] store pointsEarned and compute availablePoints
			availablePoints: this.availablePoints,
			trees: this.trees.map(tree => tree.allocationSets.map(allocations => allocations.map(allocation => allocation.value))),
		};
	}

	set stored(stored) {
		this.availablePoints = stored?.availablePoints || 0;
		this.trees.forEach((tree, treeIndex) =>
			tree.allocationSets.forEach((allocations, setIndex) =>
				allocations.forEach((allocation, allocationIndex) =>
					allocation.value = stored?.trees?.[treeIndex]?.[setIndex]?.[allocationIndex] || 0)));
	}
}

TechniqueData.StatIds = StatIds;

export default TechniqueData;
