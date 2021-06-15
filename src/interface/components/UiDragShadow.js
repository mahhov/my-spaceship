import UiComponent from './UiComponent.js';

class UiDragShadow extends UiComponent {
	constructor() {
		super(null);
		this.dragComponent = null;
	}

	beginDrag(component) {
		this.dragComponent = component;
		this.startX = this.startY = null;
	}

	update(controller) {
		let {x, y} = controller.getRawMouse();
		if (this.dragComponent && controller.getMouseState(0).active) {
			this.startX ??= this.dragComponent.coordinate.x - x;
			this.startY ??= this.dragComponent.coordinate.y - y;
			x += this.startX;
			y += this.startY;
			this.coordinate = this.dragComponent.coordinate.clone.moveTo(x, y).clamp();
		} else
			this.dragComponent = null;
	}


	paint(painter) {
		if (!this.dragComponent)
			return;
		let oldCoordinate = this.dragComponent.coordinate;
		this.dragComponent.coordinate = this.coordinate;
		this.dragComponent.paint(painter);
		this.dragComponent.coordinate = oldCoordinate;
	}
}

export default UiDragShadow;
