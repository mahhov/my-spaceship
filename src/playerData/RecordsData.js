import Emitter from '../util/Emitter.js';
import makeEnum from '../util/enum.js';
import Record from './Record.js';

// todo [high] upper case
const Ids = makeEnum({
	kills: 0,
	timePlayed: 0,
	metalCollected: 0,
	equipmentForged: 0,
	metalSalvaged: 0,
	materialsUsed: 0,
});

class RecordsData extends Emitter {
	constructor(equipmentData) {
		super();
		this.records = [
			new Record(Ids.kills, 'Kills', 0),
			new Record(Ids.timePlayed, 'Time played', 0),
			new Record(Ids.metalCollected, 'Metal collected', 0),
			new Record(Ids.equipmentForged, 'Equipment forged', 0),
		];
		equipmentData.on('forge', () => this.changeRecord(Ids.equipmentForged, 1));
		equipmentData.on('salvage', metal => this.changeRecord(Ids.metalSalvaged, metal));
		equipmentData.on('craft', () => this.changeRecord(Ids.materialsUsed, 1));
	}

	get stored() {
		return {
			records: Object.fromEntries(this.records.map(record =>
				([record.id, record.value]))),
		};
	}

	set stored(stored) {
		this.records.forEach(record =>
			record.value = stored?.records?.[record.id] || 0);
	}

	changeRecord(recordId, change) {
		this.records.find(record => record.id === recordId).value += change;
		this.emit('change');
	}
}

RecordsData.Ids = Ids;

export default RecordsData;
