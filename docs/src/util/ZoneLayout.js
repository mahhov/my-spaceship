import makeEnum from './enum.js';

const ZoneTypes = makeEnum({
	EMPTY: 0,
	ZONE: 0,
	START_ZONE: 0,
	END_ZONE: 0,
});

class ZoneLayout {
	constructor(grid = [[]], completed = grid.map(column => column.map(() => false))) {
		this.grid = grid;
		this.completed = completed;
	}
}

ZoneLayout.ZoneTypes = ZoneTypes;

export default ZoneLayout;
