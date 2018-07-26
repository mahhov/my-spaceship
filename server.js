const fs = require('fs');
const http = require('http');

fs.readFile('./build/view/index.html', (err, html) => {
	if (err)
		console.log(err);
	fs.readFile('./build/view/Canvas.js', (err, canvasJs) => {
		if (err)
			console.log(err);
		http.createServer((req, res) => {
			if (req.url === '/Canvas.js') {
				res.writeHeader(200, {"Content-Type": "text/javascript"});
				res.write(canvasJs);
				res.end();
			} else {
				res.writeHeader(200, {"Content-Type": "text/html"});
				res.write(html);
				res.end();
			}
		}).listen(8081);
	});
});
