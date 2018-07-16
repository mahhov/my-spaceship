const Path = require('../painter/Path');

const paint = (painter, x, y, width, height, moveDirection, primaryColor, secondaryColor) => {
	let xys = [];
	xys.push([x, y - height]);
	xys.push([x + width / 2, y]);
	xys.push([x, y + height / 2]);
	xys.push([x - width / 2, y]);

	painter.add(new Path(xys));
};

module.exports = paint;
