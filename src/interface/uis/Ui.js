const UiComponent = require('../components/UiComponent');

class Ui extends UiComponent {
	constructor() {
		super();
		this.components = [];
	}

	add(component) {
		this.components.push(component);
		return component;
	}

	update(controller) {
		this.components.forEach(component => component.update(controller));
	}

	paint(painter) {
		this.components.forEach(component => component.paint(painter));
	}
}

module.exports = Ui;
