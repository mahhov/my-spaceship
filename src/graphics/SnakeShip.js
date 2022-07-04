import Graphics2 from './Graphics2.js';

const TOP_WIDTH = .5, BOTTOM_WIDTH = .8, HEIGHT = .4, BOTTOM_INSET_HEIGHT = .125;
const TRAPEZOID = [
	[-TOP_WIDTH / 2, HEIGHT / 2], // top left
	[-BOTTOM_WIDTH / 2, -HEIGHT / 2], // bottom left
	[-TOP_WIDTH / 2, -HEIGHT / 2 + BOTTOM_INSET_HEIGHT], // bottom left inset
	[TOP_WIDTH / 2, -HEIGHT / 2 + BOTTOM_INSET_HEIGHT], // bottom right inset
	[BOTTOM_WIDTH / 2, -HEIGHT / 2], // bottom right
	[TOP_WIDTH / 2, HEIGHT / 2], // top right
];

const DIAMOND = [
	[0, 1], // top
	[1, 0], // right
	[0, -1], // bottom
	[-1, 0], // left
];

class SnakeShip extends Graphics2 {
	constructor(width, height, color) {
		super(width, height);
		this.addPath(new Graphics2.GraphicsPath(TRAPEZOID, true, 0, 0, 1, true, color)); // body
		this.addPath(new Graphics2.GraphicsPath(DIAMOND, false, -.22, .25, .1, true, '#f00')); // left eye
		this.addPath(new Graphics2.GraphicsPath(DIAMOND, false, .22, .25, .1, true, '#f00')); // right eye
	}
}

export default SnakeShip;
