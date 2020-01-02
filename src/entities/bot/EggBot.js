const BotHero = require('./BotHero');

class EggBot {
	constructor(player, coopBotHeroes, hostileBotHeroes) {
		this.player = player;
		this.coopBotHeroes = coopBotHeroes;
		this.hostileBotHeroes = hostileBotHeroes;
	}

	get botHeroes() {
		return [...this.coopBotHeroes, ...this.hostileBotHeroes];
	}

	update(map, intersectionFinder, monsterKnowledge) {
		// todo [high] goals
		let dummyGoal = {movement: {x: 0, y: 0}, activeAbilitiesWanted: [], abilitiesDirect: {x: 0, y: 0}};

		this.coopBotHeroes.forEach((heroBot, i) => {
			heroBot.update(map, intersectionFinder, monsterKnowledge, dummyGoal);
		});

		this.hostileBotHeroes.forEach((heroBot, i) => {
			heroBot.update(map, intersectionFinder, monsterKnowledge, dummyGoal);
		});
	}
}

module.exports = EggBot;
