const PathGenerator = require('../src/map/PathGenerator');

let pathGenerator = new PathGenerator(300, 300, 10);

let {start, end} = pathGenerator.createPathEndpoints();
console.log('>', start, end);

for (let i = 0; i < 300; i++) {
	let move = pathGenerator.updatePath(start, end);
	start.x += move.x;
	start.y += move.y;
	console.log(start);
}
