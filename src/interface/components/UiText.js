const UiComponent = require('./UiComponent');
const Text = require('../../painter/elements/Text');

class UiText extends UiComponent {
	constructor(x, y, text) {
		super();
		this.x = x;
		this.y = y;
		this.text = text;
	}

	paint(painter) {
		painter.add(new Text(this.x, this.y, this.text));
	}
}

module.exports = UiText;
