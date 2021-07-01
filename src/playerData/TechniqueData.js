import makeEnum from '../util/enum.js';
import Allocation from './Allocation.js';
import AllocationsData from './AllocationsData.js';
import Stat from './Stat.js';
import TechniqueTree from './TechniqueTree.js';

const TechniqueBase = makeEnum({
	...Stat.Ids,
	COOLDOWN_DURATION: 0,
	COOLDOWN_RATE: 0,
	MAX_CHARGES: 0,
	STAMINA_COST: 0,
	CHANNEL_STAMINA_COST: 0,
	CHANNEL_DURATION: 0,
	REPEATABLE: 0,
});

const StatIds = {
	TechniqueBase,
	ProjectileAttack: makeEnum({
		...TechniqueBase,
		ABILITY_SIZE: 0,
	}),
	AreaAttack: makeEnum({
		...TechniqueBase,
	}),
	Dash: makeEnum({
		...TechniqueBase,
	}),
	Defense: makeEnum({
		...TechniqueBase,
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
				new Allocation('Capacitor', [
					new Stat(statIds.MAX_CHARGES, 5),
				], 4, statIds, 'Store charges for high burst damage.'),
				new Allocation('Stream', [
					new Stat(statIds.COOLDOWN_DURATION, -.1),
				], 4, statIds, ''),
				new Allocation('Charged shot', [
					new Stat(statIds.DAMAGE, .5),
					new Stat(statIds.CHANNEL_DURATION, 15),
					new Stat(statIds.STAMINA_COST, 1),
					new Stat(statIds.CHANNEL_STAMINA_COST, .04),
				], 4, statIds, 'Charged attacks deal 4x more damage.'),
			],
			[
				new Allocation('Multishot', [new Stat(statIds.DAMAGE, 1)], 4, statIds, ''),
				new Allocation('Chain', [new Stat(statIds.DAMAGE, 1)], 4, statIds, ''),
				new Allocation('Pierce', [new Stat(statIds.DAMAGE, 1)], 4, statIds, ''),
			],
			[
				new Allocation('Damage', [new Stat(statIds.DAMAGE, 1)], 4, statIds, ''),
				new Allocation('Rate', [new Stat(statIds.DAMAGE, 1)], 4, statIds, ''),
				new Allocation('Poison', [new Stat(statIds.DAMAGE, 1)], 4, statIds, ''),
			],
			[
				new Allocation('Life leech', [new Stat(statIds.DAMAGE, 1)], 4, statIds, ''),
				new Allocation('Stamina gain', [new Stat(statIds.DAMAGE, 1)], 4, statIds, ''),
				new Allocation('Armor inc', [new Stat(statIds.DAMAGE, 1)], 4, statIds, ''),
			],
			[
				new Allocation('Proc x2', [new Stat(statIds.DAMAGE, 1)], 4, statIds, ''),
				new Allocation('Proc area', [new Stat(statIds.DAMAGE, 1)], 4, statIds, ''),
				new Allocation('Proc debuff', [new Stat(statIds.DAMAGE, 1)], 4, statIds, ''),
			],
			[
				new Allocation('Proc x2', [new Stat(statIds.DAMAGE, 1)], 4, statIds, ''),
				new Allocation('Proc slow', [new Stat(statIds.DAMAGE, 1)], 4, statIds, ''),
				new Allocation('Proc knockback', [new Stat(statIds.DAMAGE, 1)], 4, statIds, ''),
			],
			[
				new Allocation('Size', [new Stat(statIds.DAMAGE, 1)], 4, statIds, ''),
				new Allocation('Range', [new Stat(statIds.DAMAGE, 1)], 4, statIds, ''),
				new Allocation('Spread', [new Stat(statIds.DAMAGE, 1)], 4, statIds, ''),
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

// todo [medium] some other technique ideas
// instant damage around player, aoe debuff around player, ring around player
// area blast at target, delayed area blast at target, channelled area blast at target
// laser that waves out in wide but short aoe, laser that fires instantly, laser that fires in long range after channel
