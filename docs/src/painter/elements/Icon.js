import PainterElement from './PainterElement.js';

class Icon extends PainterElement {
	constructor(coordinate, imagePath) {
		super();
		this.coordinate = coordinate;
		this.image = Icon.loadImage(imagePath);
	}

	static loadImage(path) {
		Icon.loadImageCache ||= {};
		if (!Icon.loadImageCache[path]) {
			Icon.loadImageCache[path] = new Image();
			Icon.loadImageCache[path].src = path;
		}
		return Icon.loadImageCache[path];
	}

	paint(xt, yt, context) {
		let tLeft = xt(this.coordinate.left);
		let tTop = yt(this.coordinate.top);
		let tWidth = xt(this.coordinate.width);
		let tHeight = yt(this.coordinate.height);
		context.drawImage(this.image, tLeft, tTop, tWidth, tHeight);
	}
}

export default Icon;
