import Painter from './Painter.js';

class PainterCompositor {
	constructor(canvas) {
		this.width = canvas.width;
		this.height = canvas.height;
		this.context = canvas.getContext('2d');
		this.painter = new Painter(this.width, this.height);
		this.uiPainter = new Painter(this.width, this.height);
	}

	clear() {
		this.painter.clear();
		this.uiPainter.clear();
	}

	paint() {
		this.painter.paint();
		this.uiPainter.paint();

		this.context.fillStyle = 'white';
		this.context.fillRect(0, 0, this.width, this.height);
		this.context.drawImage(this.painter.canvas, 0, 0);
		this.context.drawImage(this.uiPainter.canvas, 0, 0);
	}
}

export default PainterCompositor;
