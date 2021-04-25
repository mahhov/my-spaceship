import Bar from './Bar.js';

class WideBar extends Bar {
	constructor(paintUiRow, fillRatio, emptyColor, fillColor, borderColor) {
		const MARGIN = .02, WIDTH = 1 - MARGIN * 2;
		let top = MARGIN * (1 + paintUiRow * 2);
		super(MARGIN, top, WIDTH, MARGIN, fillRatio, emptyColor, fillColor, borderColor);
	}
}

export default WideBar;
