const PathCreator = require('./PathCreator');

const paint = (painter, x, y, width, height, moveDirection, primaryColor, secondaryColor) => {
	let pathCreator = new PathCreator(primaryColor);
	pathCreator
		.setTranslation(x, y)
		.setForward(...moveDirection)
		.setScale(width, height, .4)
		.moveTo(1, .5)
		.moveTo(3, 2)
		.moveTo(2, -2)
		.moveTo(0, -1)
		.moveTo(-2, -2)
		.moveTo(-3, 2)
		.moveTo(-1, .5);
	painter.add(pathCreator.create())
};

module.exports = paint;
