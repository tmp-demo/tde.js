
function AudioAnalyser(analyserNode) {
  this.node = analyserNode;
  this.node.maxDecibels = 0;
  this.array = new Float32Array(analyserNode.fftSize);
  this.debug = false;
  if (this.debug) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = window.innerWidth;
    this.canvas.height = 300;
    document.body.appendChild(this.canvas);
    this.canvas.className = "visualizer";
    this.c = this.canvas.getContext("2d");
  }
}


AudioAnalyser.prototype.doFFT = function() {
  this.node.getFloatFrequencyData(this.array);
}

AudioAnalyser.prototype.beat = function(a) {
  var avgRange = [0, 5];
  var sum = 0;
  for (var i = avgRange[0]; i < avgRange[0] + avgRange[1]; i++) {
    sum += this.array[i];
  }
  sum /= avgRange[1] - avgRange[0];
  sum -= this.node.minDecibels;
  sum /= -(this.node.minDecibels - this.node.maxDecibels);
  if (this.debug) {
    this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    var binW = Math.ceil(this.canvas.width / this.array.length);
    for (var i = 0; i < this.array.length; i++) {
      if (i >= avgRange[0] && i < avgRange[1]) {
        this.c.fillStyle = "#0f0";
      } else {
        this.c.fillStyle = "#f00";
      }
      if (this.array[i] == 0) {
        break;
      }
      this.c.fillRect(i * binW, this.canvas.height, binW, ( -this.array[i] - 100 ) * 4);
    }
  }
  return sum;
}

AudioAnalyser.prototype.getFFT = function() {
  return this.array;
}

AudioAnalyser.prototype.getRMS = function() {
  var rms = 0;

  for (var i = 0; i < this.array.length; i++) {
    rms += Math.sqrt(this.array[i] * this.array[i]);
  }

  rms /= this.array.length;

  return rms;
}

function init_audio(demo) {
  if (window.AudioContext) {
    demo.ac = new AudioContext();
  } else {
    demo.ac = new webkitAudioContext();
  }

  // everything gets connected to the AnayserNode for obvious reasons
  demo.audio_sink = demo.ac.createAnalyser();
  demo.audio_sink.connect(demo.ac.destination);
  demo.an = new AudioAnalyser(demo.audio_sink);
}
