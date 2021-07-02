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
		ABILITY_MULTISHOT: 0,
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
					new Stat(statIds.MAX_CHARGES, 20),
				], 1, statIds, 'Store charges for high burst damage.'),
				new Allocation('Stream', [
					new Stat(statIds.COOLDOWN_DURATION, -.4),
				], 1, statIds, ''),
				new Allocation('Charged shot', [
					new Stat(statIds.CHANNEL_DURATION, 15),
					new Stat(statIds.STAMINA_COST, 8),
					new Stat(statIds.CHANNEL_STAMINA_COST, .15),
				], 1, statIds, 'Charged attacks deal 20x more damage.'),
			],
			[
				new Allocation('Multishot', [
					new Stat(statIds.DAMAGE, -.3),
					new Stat(statIds.STAMINA_COST, .4),
					new Stat(statIds.CHANNEL_STAMINA_COST, .1),
					new Stat(statIds.ABILITY_MULTISHOT, 3),
				], 1, statIds, 'Fire a cone of projectiles.'),
				new Allocation('Chain TODO', [
					new Stat(statIds.DAMAGE, 1),
				], 1, statIds, ''),
				new Allocation('Pierce TODO', [
					new Stat(statIds.DAMAGE, 1),
				], 1, statIds, ''),
			],
			[
				new Allocation('Damage', [
					new Stat(statIds.DAMAGE, 1),
				], 1, statIds, 'Increase hit damage.'),
				new Allocation('Rate', [
					new Stat(statIds.COOLDOWN_RATE, 1),
				], 1, statIds, ''),
				new Allocation('Poison', [
					new Stat(statIds.DAMAGE_OVER_TIME, 1.5),
				], 1, statIds, 'Apply stacking DoT proportional to hit damage.'),
			],
			[
				new Allocation('Life leech', [
					new Stat(statIds.LIFE_LEECH, .05),
				], 1, statIds, 'Gain life proportional to hit damage.'),
				new Allocation('Stamina gain', [
					new Stat(statIds.STAMINA_GAIN, .15),
				], 1, statIds, 'Gain flat stamina on hit.'),
				new Allocation('Armor inc', [
					new Stat(statIds.DAMAGE, 1),
				], 1, statIds, ''),
			],
			[
				new Allocation('Proc x2', [
					new Stat(statIds.DAMAGE, 1),
				], 1, statIds, ''),
				new Allocation('Proc area', [
					new Stat(statIds.DAMAGE, 1),
				], 1, statIds, ''),
				new Allocation('Proc debuff', [
					new Stat(statIds.DAMAGE, 1),
				], 1, statIds, ''),
			],
			[
				new Allocation('Proc x2', [
					new Stat(statIds.DAMAGE, 1),
				], 1, statIds, ''),
				new Allocation('Proc slow', [
					new Stat(statIds.DAMAGE, 1),
				], 1, statIds, ''),
				new Allocation('Proc knockback', [
					new Stat(statIds.DAMAGE, 1),
				], 1, statIds, ''),
			],
			[
				new Allocation('Size', [
					new Stat(statIds.DAMAGE, 1),
				], 1, statIds, ''),
				new Allocation('Range', [
					new Stat(statIds.DAMAGE, 1),
				], 1, statIds, ''),
				new Allocation('Spread', [
					new Stat(statIds.DAMAGE, 1),
				], 1, statIds, ''),
			],
		]);
	}

	static get areaAttackTree() {
		let statIds = StatIds.AreaAttack;
		return new TechniqueTree(TechniqueTree.Ids.AREA_ATTACK, [
			[
				new Allocation('Area', [], 1, statIds, ''),
				new Allocation('Pulsing', [], 1, statIds, ''),
				new Allocation('Lingering dot', [], 1, statIds, ''),
			],
			[
				new Allocation('Area', [], 1, statIds, ''),
				new Allocation('Ring', [], 1, statIds, ''),
				new Allocation('Protruding', [], 1, statIds, ''),
			],
			[
				new Allocation('Damage', [], 1, statIds, ''),
				new Allocation('Aoe', [], 1, statIds, ''),
				new Allocation('Cooldown', [], 1, statIds, ''),
			],
			[
				new Allocation('Knockback', [], 1, statIds, ''),
				new Allocation('Slow', [], 1, statIds, ''),
				new Allocation('Armor debuff', [], 1, statIds, ''),
			],
		]);
	}

	static get dashTree() {
		let statIds = StatIds.Dash;
		return new TechniqueTree(TechniqueTree.Ids.DASH, [
			[
				new Allocation('Dash', [], 1, statIds, ''),
				new Allocation('Blink to target', [], 1, statIds, ''),
				new Allocation('Teleport', [], 1, statIds, ''),
			],
			[
				new Allocation('Haste', [], 1, statIds, ''),
				new Allocation('Damage', [], 1, statIds, ''),
				new Allocation('Armor', [], 1, statIds, ''),
			],
			[
				new Allocation('Damage', [], 1, statIds, ''),
				new Allocation('Slow', [], 1, statIds, ''),
				new Allocation('Knockback', [], 1, statIds, ''),
			],
			[
				new Allocation('Range', [], 1, statIds, ''),
				new Allocation('Stamina', [], 1, statIds, ''),
				new Allocation('Cooldown', [], 1, statIds, ''),
			],
		]);
	}

	static get defenseTree() {
		let statIds = StatIds.Defense;
		return new TechniqueTree(TechniqueTree.Ids.DEFENSE, [
			[
				new Allocation('Heal', [], 1, statIds, ''),
				new Allocation('Armor', [], 1, statIds, ''),
				new Allocation('Heal over time', [], 1, statIds, ''),
			],
			[
				new Allocation('Amount', [], 1, statIds, ''),
				new Allocation('Duration', [], 1, statIds, ''),
				new Allocation('Cooldown', [], 1, statIds, ''),
			],
			[
				new Allocation('No stamina', [], 1, statIds, ''),
				new Allocation('Auto cast on low health', [], 1, statIds, ''),
				new Allocation('Saving from killing blow', [], 1, statIds, ''),
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
		this.trees
			.flatMap(tree => tree.allocationSets)
			.find(allocationSet => allocationSet.includes(allocation))
			.filter(allocationI => allocationI !== allocation)
			.forEach(allocation => this.clear(allocation));
		super.allocate(allocation, value);
	}
}

TechniqueData.StatIds = StatIds;

export default TechniqueData;

// todo [medium] some other technique ideas
// instant damage around player, aoe debuff around player, ring around player
// area blast at target, delayed area blast at target, channelled area blast at target
// laser that waves out in wide but short aoe, laser that fires instantly, laser that fires in long range after channel
