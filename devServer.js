const fs = require('fs');
const http = require('http');
const promisify = require('util').promisify;
const browserify = require('browserify');

const PORT = 8086;
const BUILD_DIR = 'build';
const FILES = {
	'/': {input: './src/view/index.html', output: `./${BUILD_DIR}/index.html`, step: 'copy'},
	'/Canvas.js': {input: './src/view/Canvas.js', output: `./${BUILD_DIR}/Canvas.js`, step: 'bundle'},
	'/exit': {step: 'exit'},
};
const BROWSERIFY_OPTIONS = {debug: true, detectGlobals: false, builtins: []};

let processFileConfig = fileConfig => {
	switch (fileConfig.step) {
		case 'copy':
			return fs.promises.copyFile(fileConfig.input, fileConfig.output);
		case 'bundle':
			return new Promise((resolve, reject) =>
				browserify(fileConfig.input, BROWSERIFY_OPTIONS)
					.bundle()
					.on('error', e => reject('FAILED TO BUNDLE ' + e))
					.pipe(fs.createWriteStream(fileConfig.output))
					.on('close', resolve));
		case 'exit':
			process.exit(); // todo [low] send response before exit
	}
};

let main = async () => {
	// Because intellij doesn't clean up nicely
	await new Promise(resolve => http.get(`http://localhost:${PORT}/exit`).on('response', resolve).on('error', resolve)); // todo [low] avoid double 'on'

	http.createServer(async (req, res) => {
		let fileConfig = FILES[req.url] || FILES['/'];
		console.log(req.url, fileConfig);
		try {
			await processFileConfig(fileConfig);
			res.end(await fs.promises.readFile(fileConfig.output));
		} catch (e) {
			console.error(e);
			res.end(e);
		}
	}).listen(PORT);
	console.log('Listening', PORT)
};

main();
