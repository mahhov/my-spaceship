const fs = require('fs');
const http = require('http');
const promisify = require('util').promisify;
const browserify = require('browserify');

const PORT = 8089;
const BUILD_DIR = 'build';
const HTML_INPUT = './src/view/index.html';
const HTML_OUTPUT = `./${BUILD_DIR}/index.html`;
const SCRIPT_INPUT = './src/view/Canvas.js';
const SCRIPT_OUTPUT = `./${BUILD_DIR}/Canvas.js`;
const BROWSERIFY_OPTIONS = {debug: true, detectGlobals: false, builtins: []};

console.log(HTML_OUTPUT, SCRIPT_OUTPUT);

let build = async () => {
	let htmlCopyPromise = fs.promises.copyFile(HTML_INPUT, HTML_OUTPUT)
		.catch(e => console.log('unable to copy HTML', e));
	let scriptBundleStream = browserify(SCRIPT_INPUT, BROWSERIFY_OPTIONS)
		.bundle()
		.pipe(fs.createWriteStream(SCRIPT_OUTPUT));
	await htmlCopyPromise;
	await new Promise(resolve => scriptBundleStream.on('close', resolve));
};

http.createServer(async (req, res) => {
	console.log(req.url);
	try {
		switch (req.url) {
			case
			'/Canvas.js':
				res.end(await fs.promises.readFile(SCRIPT_OUTPUT));
				break;
			default:
				await build();
				res.end(await fs.promises.readFile(HTML_OUTPUT));
		}
	} catch (e) {
		console.log('error', e);
	}
}).listen(PORT);
