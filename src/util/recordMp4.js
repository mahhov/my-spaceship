let record = (ms = 0) => {
	let stream = canvas.captureStream(20);
	let recorder = new MediaRecorder(stream, {mimeType: 'video/webm'});
	let data = [];

	recorder.addEventListener('dataavailable', event => data.push(event.data));

	recorder.addEventListener('stop', () => {
		let blob = new Blob(data, {type: 'video/webm'});
		let exportUrl = URL.createObjectURL(blob);
		window.open(exportUrl, '_blank');
	});

	window.stopRecording = () => {
		recorder.stop();
		stream.getTracks().forEach(track => track.stop());
	};

	if (ms)
		setTimeout(() => stop, ms);
	recorder.start();
};

export default record;
