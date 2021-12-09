const video = document.getElementById("myvideo");
const handimg = document.getElementById("handimage");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
let trackButton = document.getElementById("trackbutton");
let nextImageButton = document.getElementById("nextimagebutton");
let updateNote = document.getElementById("updatenote");

let imgindex = 1;
let isVideo = false;
let model = null;

const modelParams = {
  flipHorizontal: true, // flip e.g for video
  maxNumBoxes: 20, // maximum number of boxes to detect
  iouThreshold: 0.5, // ioU threshold for non-max suppression
  scoreThreshold: 0.6, // confidence threshold for predictions.
};

function startVideo() {
  handTrack.startVideo(video).then(function (status) {
    console.log("video started", status);
    if (status) {
      updateNote.innerText = "Video started. Now tracking";
      isVideo = true;
      runDetection();
    } else {
      updateNote.innerText = "Please enable video";
    }
  });
}

function toggleVideo() {
  if (!isVideo) {
    updateNote.innerText = "Starting video";
    startVideo();
  } else {
    updateNote.innerText = "Stopping video";
    handTrack.stopVideo(video);
    isVideo = false;
    updateNote.innerText = "Video stopped";
  }
}

nextImageButton.addEventListener("click", function () {
  nextImage();
});

trackButton.addEventListener("click", function () {
  toggleVideo();
});

function nextImage() {
  imgindex++;
  handimg.src = "images/" + (imgindex % 9) + ".jpg";
  setTimeout(() => {
    runDetectionImage(handimg);
  }, 500);
}

function getRandom(min, max) { // min and max included 
  return Math.random() * (max - min + 1) + min
}

var start = Date.now()
var end = Date.now()
var delta = 0

var count = 0
let notes = ["C", "D", "E", "F", "G", "A", "B"];
let octaves = ["2", "3", "4", "5", "6", "7"];
synth = new Tone.Synth().toMaster();
let oldnoteoctave = "";
divX = 640/notes.length;
divY = 480/octaves.length

function runDetection() {
  count++
  console.log(count)


  delta = Date.now() - start;
  // if (delta > 20000) { 
  //   x = getRandom(120, 520)
  //   y = getRandom(40, 440)
  //   sendPosition(x, y)
  // }

  model.detect(video).then((predictions) => {
    console.log("Predictions: ", predictions);
    for (let i = 0; i < predictions.length; i++){
      if (predictions[i].class == 1){

        let box_x_center = predictions[i].bbox[0] + predictions[i].bbox[2] / 2
        let box_y_center = predictions[i].bbox[1] + predictions[i].bbox[3] / 2

        let note = Math.round((box_x_center + (divX / 2)) / divX) - 1
        let octave = Math.round((box_y_center + (divX / 2)) / divX) - 1;
        let newnoteoctave = notes[note] + octaves[octave];
        if (oldnoteoctave != newnoteoctave) {
          oldnoteoctave = newnoteoctave;
          synth.triggerRelease();
          synth.triggerAttack(newnoteoctave);
        } else {
          synth.triggerRelease();
        }

        console.log("open center x " + box_x_center + " center y " + box_y_center)
        if (delta > 200){
          sendPosition(box_x_center, box_y_center) 
          start = Date.now()
        }
      }
    }

    model.renderPredictions(predictions, canvas, context, video);
    if (isVideo) {
      requestAnimationFrame(runDetection);
    }
  });
}

function sendPosition(x,y){
  let url='http://172.18.139.99:5000/position?x='+x+"&&y="+y
  var httpRequest = new XMLHttpRequest();
      httpRequest.open('GET', url, true);
      httpRequest.send();
     
  httpRequest.onreadystatechange = function () {
      if (httpRequest.readyState == 4 && httpRequest.status == 200) {
          var json = httpRequest.responseText;
          console.log(json);
      }
  };
}

function runDetectionImage(img) {
  model.detect(img).then((predictions) => {
    console.log("Predictions: ", predictions);
    model.renderPredictions(predictions, canvas, context, img);
  });
}

// Load the model.
handTrack.load(modelParams).then((lmodel) => {
  // detect objects in the image.
  model = lmodel;
  console.log(model);
  updateNote.innerText = "Loaded Model!";
  runDetectionImage(handimg);
  trackButton.disabled = false;
  nextImageButton.disabled = false;
});
