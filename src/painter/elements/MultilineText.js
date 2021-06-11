import Canvas from '../Painter.js';
import Text from './Text.js';

const MEASURE_TEXT_CONTEXT = Canvas.createCanvas(0, 0).getContext('2d');

class MultilineText extends Text {
	// todo [medium] replace constructor param with setOptions() like Text
	constructor(coordinate, text) {
		super(coordinate, text);
		this.wrappedLines = null;
	}

	static measureText(size) {
		MEASURE_TEXT_CONTEXT.font = `${size} monospace`;
		let tCharMeasurement = MEASURE_TEXT_CONTEXT.measureText('t');
		let yCharMeasurement = MEASURE_TEXT_CONTEXT.measureText('y');
		let width = tCharMeasurement.width;
		let height = tCharMeasurement.actualBoundingBoxAscent + yCharMeasurement.actualBoundingBoxDescent;
		return {width, height};
	}

	wrapText(xt) {
		let {width, height} = MultilineText.measureText(this.size);
		this.lineHeight = height + 2;
		let charsPerLine = Math.max(Math.floor(xt(this.coordinate.width) / width), 1);
		this.wrappedLines = [];
		let lineLength = 0;
		let words = this.text.split(' ').flatMap(word => {
			let broken = [];
			for (let i = 0; i < word.length; i += charsPerLine)
				broken.push(word.substring(i, i + charsPerLine));
			return broken;
		});
		for (let i = 0; i < words.length; i++) {
			if (lineLength + i + words[i].length <= charsPerLine)
				lineLength += words[i].length;
			else {
				this.wrappedLines.push(words.splice(0, i).join(' '));
				lineLength = 0;
				i = -1;
			}
		}
		this.wrappedLines.push(words.join(' '));
	}

	updated() {
		// call when width, text, or size changes
		this.wrappedLines = null;
	}

	paint(xt, yt, context) {
		if (!this.wrappedLines)
			this.wrapText(xt);

		this.setFillMode(context);
		this.setFont(context);

		this.wrappedLines.forEach((line, i) => {
			let lineY = i * this.lineHeight;
			if (lineY + this.lineHeight < yt(this.coordinate.height))
				context.fillText(line, xt(this.coordinate.left), yt(this.coordinate.top) + lineY);
		});
	}
}

export default MultilineText;
