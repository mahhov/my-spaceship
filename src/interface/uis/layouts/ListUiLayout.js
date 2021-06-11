import UiGridLayout from './UiLayout.js';

class ListUiLayout extends UiGridLayout {
	constructor(coordinate, lineHeight) {
		super(coordinate, 1, lineHeight, 0, 0);
	}
}

export default ListUiLayout;
