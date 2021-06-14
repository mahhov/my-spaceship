import Emitter from '../util/Emitter.js';
import makeEnum from '../util/enum.js';
import Record from './Record.js';

const Ids = makeEnum({kills: 0, timePlayed: 0, metalCollected: 0, equipmentsForged: 0});

class RecordsData extends Emitter {
	constructor() {
		super();
		this.records = [
			new Record(Ids.kills, 'Kills', 0),
			new Record(Ids.timePlayed, 'Time played', 0),
			new Record(Ids.metalCollected, 'Metal collected', 0),
			new Record(Ids.equipmentsForged, 'Equipments forged', 0),
		];
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
