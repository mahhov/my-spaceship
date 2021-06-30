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
	AreaAttack: makeEnum({
		...Stat.Ids,
	}),
	Dash: makeEnum({
		...Stat.Ids,
	}),
	Defense: makeEnum({
		...Stat.Ids,
	}),
};

// todo [high] wire in

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
		let statIds = StatIds.ProjectileAttack;
		return new TechniqueTree(TechniqueTree.Ids.PROJECTILE_ATTACK, [
			[
				new Allocation('Charges', [new Stat(statIds.ABILITY_CHARGES, 1)], 4, statIds, ''),
				new Allocation('Laser', [new Stat(statIds.ABILITY_SIZE, 1)], 4, statIds, ''),
				new Allocation('Channel', [new Stat(statIds.DAMAGE, 1)], 4, statIds, ''),
			],
			[
				new Allocation('Multishot', [new Stat(statIds.ABILITY_CHARGES, 1)], 4, statIds, ''),
				new Allocation('Chain', [new Stat(statIds.ABILITY_SIZE, 1)], 4, statIds, ''),
				new Allocation('Pierce', [new Stat(statIds.ABILITY_SIZE, 1)], 4, statIds, ''),
			],
			[
				new Allocation('Damage', [new Stat(statIds.ABILITY_CHARGES, 1)], 4, statIds, ''),
				new Allocation('Rate', [new Stat(statIds.ABILITY_CHARGES, 1)], 4, statIds, ''),
				new Allocation('Poison', [new Stat(statIds.ABILITY_SIZE, 1)], 4, statIds, ''),
			],
			[
				new Allocation('Life leech', [new Stat(statIds.ABILITY_CHARGES, 1)], 4, statIds, ''),
				new Allocation('Stamina gain', [new Stat(statIds.ABILITY_CHARGES, 1)], 4, statIds, ''),
				new Allocation('Armor inc', [new Stat(statIds.ABILITY_SIZE, 1)], 4, statIds, ''),
			],
			[
				new Allocation('Proc x2', [new Stat(statIds.ABILITY_CHARGES, 1)], 4, statIds, ''),
				new Allocation('Proc area', [new Stat(statIds.ABILITY_SIZE, 1)], 4, statIds, ''),
				new Allocation('Proc debuff', [new Stat(statIds.ABILITY_SIZE, 1)], 4, statIds, ''),
			],
			[
				new Allocation('Proc x2', [new Stat(statIds.ABILITY_CHARGES, 1)], 4, statIds, ''),
				new Allocation('Proc slow', [new Stat(statIds.ABILITY_CHARGES, 1)], 4, statIds, ''),
				new Allocation('Proc knockback', [new Stat(statIds.ABILITY_SIZE, 1)], 4, statIds, ''),
			],
			[
				new Allocation('Size', [new Stat(statIds.ABILITY_CHARGES, 1)], 4, statIds, ''),
				new Allocation('Range', [new Stat(statIds.ABILITY_SIZE, 1)], 4, statIds, ''),
				new Allocation('Spread', [new Stat(statIds.ABILITY_SIZE, 1)], 4, statIds, ''),
			],
		]);
	}

	static get areaAttackTree() {
		let statIds = StatIds.AreaAttack;
		return new TechniqueTree(TechniqueTree.Ids.AREA_ATTACK, [
			[
				new Allocation('Area', [], 4, statIds, ''),
				new Allocation('Pulsing', [], 4, statIds, ''),
				new Allocation('Lingering dot', [], 4, statIds, ''),
			],
			[
				new Allocation('Area', [], 4, statIds, ''),
				new Allocation('Ring', [], 4, statIds, ''),
				new Allocation('Protruding', [], 4, statIds, ''),
			],
			[
				new Allocation('Damage', [], 4, statIds, ''),
				new Allocation('Aoe', [], 4, statIds, ''),
				new Allocation('Cooldown', [], 4, statIds, ''),
			],
			[
				new Allocation('Knockback', [], 4, statIds, ''),
				new Allocation('Slow', [], 4, statIds, ''),
				new Allocation('Armor debuff', [], 4, statIds, ''),
			],
		]);
	}

	static get dashTree() {
		let statIds = StatIds.Dash;
		return new TechniqueTree(TechniqueTree.Ids.DASH, [
			[
				new Allocation('Dash', [], 4, statIds, ''),
				new Allocation('Blink to target', [], 4, statIds, ''),
				new Allocation('Teleport', [], 4, statIds, ''),
			],
			[
				new Allocation('Haste', [], 4, statIds, ''),
				new Allocation('Damage', [], 4, statIds, ''),
				new Allocation('Armor', [], 4, statIds, ''),
			],
			[
				new Allocation('Damage', [], 4, statIds, ''),
				new Allocation('Slow', [], 4, statIds, ''),
				new Allocation('Knockback', [], 4, statIds, ''),
			],
			[
				new Allocation('Range', [], 4, statIds, ''),
				new Allocation('Stamina', [], 4, statIds, ''),
				new Allocation('Cooldown', [], 4, statIds, ''),
			],
		]);
	}

	static get defenseTree() {
		let statIds = StatIds.Defense;
		return new TechniqueTree(TechniqueTree.Ids.DEFENSE, [
			[
				new Allocation('Heal', [], 4, statIds, ''),
				new Allocation('Armor', [], 4, statIds, ''),
				new Allocation('Heal over time', [], 4, statIds, ''),
			],
			[
				new Allocation('Amount', [], 4, statIds, ''),
				new Allocation('Duration', [], 4, statIds, ''),
				new Allocation('Cooldown', [], 4, statIds, ''),
			],
			[
				new Allocation('No stamina', [], 4, statIds, ''),
				new Allocation('Auto cast on low health', [], 4, statIds, ''),
				new Allocation('Saving from killing blow', [], 4, statIds, ''),
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

	allocate(allocation, value) {
		if (!this.trees
			.flatMap(tree => tree.allocationSets)
			.find(allocationSet => allocationSet.includes(allocation))
			.filter(allocationI => allocationI !== allocation)
			.some(allocationI => allocationI !== allocation && allocationI.value))
			super.allocate(allocation, value);
	}
}

TechniqueData.StatIds = StatIds;

export default TechniqueData;
