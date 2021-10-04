const video = document.getElementById('video');

function startVideo() {
    navigator.getUserMedia = (navigator.getUserMedia || 
                              navigator.webkitGetUserMedia || 
                              navigator.mozGetUserMedia || 
                              navigator.msGetUserMedia);

    navigator.getUserMedia({ video: {} },
                            stream => video.srcObject = stream,
                            error => console.log(error));
}

const MODEL_URL = '/models';
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
    faceapi.loadSsdMobilenetv1Model(MODEL_URL),
    faceapi.loadFaceLandmarkModel(MODEL_URL),
    faceapi.loadFaceRecognitionModel(MODEL_URL)
]).then(startVideo());

video.addEventListener('play', async () => {
    const labels = ['Adriano'];

    const labeledFaceDescriptors = await Promise.all(
        labels.map(async label => {
            const imgUrl = `faces/${label}.jpg`
            const img = await faceapi.fetchImage(imgUrl);

            const fullFaceDescription = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
            
            if (!fullFaceDescription) {
                throw new Error(`no faces detected for ${label}`);
            }
            
            const faceDescriptors = [fullFaceDescription.descriptor]
            return new faceapi.LabeledFaceDescriptors(label, faceDescriptors)
        })
    );

    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {

        const detections = await faceapi.detectAllFaces(video) //, new faceapi.TinyFaceDetectorOptions())
                                        .withFaceLandmarks()
                                        .withFaceExpressions()
                                        .withFaceDescriptors();
        const resizeDetections = faceapi.resizeResults(detections, displaySize);

        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        //faceapi.draw.drawDetections(canvas, resizeDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizeDetections);
        //faceapi.draw.drawFaceExpressions(canvas, resizeDetections);
/*
        const maxDescriptorDistance = 0.6;
        const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, maxDescriptorDistance);

        const results = detections.map(fd => faceMatcher.findBestMatch(fd.descriptor));

        results.forEach((bestMatch, i) => {
            const box = resizeDetections[i].detection.box;
            const text = bestMatch.toString();
            const drawBox = new faceapi.draw.DrawBox(box, { label: text });
            drawBox.draw(canvas);
        });
*/
    }, 100);
});

/*
video.addEventListener('play', () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);
    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                                        .withFaceLandmarks()
                                        .withFaceExpressions();
        const resizeDetections = faceapi.resizeResults(detections, displaySize);

        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        //faceapi.draw.drawDetections(canvas, resizeDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizeDetections);
        //faceapi.draw.drawFaceExpressions(canvas, resizeDetections);
    }, 100);
});
*/
