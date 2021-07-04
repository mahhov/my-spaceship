import makeEnum from '../util/enum.js';

const EventIds = makeEnum({
	INTERSECTION: 0,
	DEALT_DAMAGE: 0,
	KILLED: 0,
});

class EntityObserver {
	constructor() {
		this.queuedEvents = [];
	}

	queueEvent(eventId, ...args) {
		this.queuedEvents.push([eventId, ...args]);
	}

	getQueuedEvents(eventId) {
		return this.queuedEvents
			.filter(([eventIdI]) => eventIdI === eventId)
			.map(([_, ...args]) => args);
	}

	clearQueuedEvents(eventId) {
		this.queuedEvents = this.queuedEvents.filter(([eventIdI]) => eventIdI !== eventId);
	}

	clearAllQueuedEvents() {
		this.queuedEvents = [];
	}
}

EntityObserver.EventIds = EventIds;

export default EntityObserver;
