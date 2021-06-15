import Emitter from '../util/Emitter.js';
import makeEnum from '../util/enum.js';
import Record from './Record.js';

const Ids = makeEnum({
	KILLS: 0,
	TIME_PLAYED: 0,
	METAL_COLLECTED: 0,
	EQUIPMENT_FORGED: 0,
	METAL_SALVAGED: 0,
	MATERIALS_USED: 0,
});

class RecordsData extends Emitter {
	constructor(equipmentData) {
		super();
		this.records = [
			new Record(Ids.KILLS, 'Kills', 0),
			new Record(Ids.TIME_PLAYED, 'Time played', 0),
			new Record(Ids.METAL_COLLECTED, 'Metal collected', 0),
			new Record(Ids.EQUIPMENT_FORGED, 'Equipment forged', 0),
		];
		equipmentData.on('forge', () => this.changeRecord(Ids.EQUIPMENT_FORGED, 1));
		equipmentData.on('salvage', metal => this.changeRecord(Ids.METAL_SALVAGED, metal));
		equipmentData.on('craft', () => this.changeRecord(Ids.MATERIALS_USED, 1));
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
