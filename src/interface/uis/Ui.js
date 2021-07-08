import UiComponent from '../components/UiComponent.js';

class Ui extends UiComponent {
	constructor() {
		super(null);
		this.components = [];
	}

	add(component) {
		this.components.push(component);
		return component;
	}

	get visibleComponents() {
		return this.components.filter(component => component.visible);
	}

	update(controller) {
		this.visibleComponents.forEach(component => component.update(controller));
	}

	paint(painter) {
		this.visibleComponents.forEach(component => component.paint(painter));
	}
}

export default Ui;
