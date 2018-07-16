const PathCreator = require('./PathCreator');

const paint = (painter, x, y, width, height, moveDirection, primaryColor, secondaryColor) => {
	let pathCreator = new PathCreator(primaryColor);
	pathCreator
		.setTranslation(x, y)
		.setForward(...moveDirection)
		.setScale(width, height, 1.25)
		.moveTo(0, 1)
		.moveTo(.5, 0)
		.moveTo(0, -.5)
		.moveTo(-.5, 0);
	painter.add(pathCreator.create())
};

module.exports = paint;
