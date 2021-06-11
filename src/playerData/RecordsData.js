import Emitter from '../util/Emitter.js';
import makeEnum from '../util/enum.js';
import RecordItem from './RecordItem.js';

const Ids = makeEnum({kills: 0, timePlayed: 0, metalCollected: 0, itemsForged: 0});

class RecordsData extends Emitter {
	constructor() {
		super();
		this.recordItems = [
			new RecordItem(Ids.kills, 'Kills', 0),
			new RecordItem(Ids.timePlayed, 'Time played', 0),
			new RecordItem(Ids.metalCollected, 'Metal collected', 0),
			new RecordItem(Ids.itemsForged, 'Items forged', 0),
		];
	}

	get stored() {
		return {
			recordItems: Object.fromEntries(this.recordItems.map(recordItem =>
				([recordItem.id, recordItem.value]))),
		};
	}

	set stored(stored) {
		this.recordItems.forEach(recordItem =>
			recordItem.value = stored?.recordItems?.[recordItem.id] || 0);
	}

	changeRecord(recordId, change) {
		this.recordItems.find(recordItem => recordItem.id === recordId).value += change;
		this.emit('change');
	}
}

RecordsData.Ids = Ids;

export default RecordsData;
