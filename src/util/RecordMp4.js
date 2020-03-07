let record = (ms = 0) => {
	let stream = canvas.captureStream(20);
	let recorder = new MediaRecorder(stream);
	let data = [];

	recorder.addEventListener('dataavailable', event => data.push(event.data));

	recorder.addEventListener('stop', () => {
		console.log('r done', data);

		let file = new File(data, '', {type: "video/mp4"});
		let exportUrl = URL.createObjectURL(file);
		console.log(exportUrl);
		window.open(exportUrl, '_blank');
	});

	let stop = () => {
		recorder.stop();
		stream.getTracks().forEach(track => track.stop());
	};

	if (ms)
		setTimeout(() => stop, ms);
	recorder.start();

	return stop;
};

module.exports = record;
