function $(s) {
  return document.querySelector(s);
}

function $$(s) {
  return document.querySelectorAll(s);
}

function BeatDetector(analyserNode) {
  this.node = analyserNode;
  this.array = new Float32Array(analyserNode.fftSize);
}

BeatDetector.prototype.beat = function() {
  this.node.getFloatFrequencyData(this.array);
  var avgWidth = 10;
  var sum = 0;
  for (var i = 0; i < avgWidth; i++) {
    sum += this.array[i];
  }
  sum /= avgWidth;
  sum -= this.node.minDecibels;
  sum /= -(this.node.minDecibels - this.node.maxDecibels);
  return sum;
}

seeker = null;
gl = null;
cvs = null;
ac = null;
bd = null;
/* vertex buffer for our quad */
buffer = null;
D = {
  /* time in ms */
  currentTime: 0,
  startTime: 0,
  endTime: 0,
  PAUSED: 0,
  PLAYING: 1,
  ENDED: 2,
  playState: null,
  scenes: [],
  programs: [],
  currentScene: null,
  currentProgram: null,
  shaders: {},
  sounds: {}
};
function updateCurrentTime() {
  D.currentTime = Date.now() - D.startTime;
  seeker.value = D.currentTime;
  gl.uniform1f(gl.getUniformLocation(D.currentProgram, 'time'),
               D.currentTime - D.scenes[D.currentScene].start);
   gl.uniform1f(gl.getUniformLocation(D.currentProgram, 'duration'),
                D.scenes[D.currentScene].duration);
  gl.uniform2f(gl.getUniformLocation(D.currentProgram, 'res'),
               cvs.width, cvs.height);
  gl.uniform1f(gl.getUniformLocation(D.currentProgram, 'beat'),
               bd.beat());
}
function seek(time) {
  D.startTime = Date.now() - time;
  D.currentTime = Date.now() - D.startTime;
  D.currentScene = findSceneForTime(D.currentTime);
  if (D.playState == D.PAUSED) {
    updateScene();
    render();
  }
  if (D.playState == D.ENDED) {
    D.playState = D.PLAYING;
    mainloop();
  }
}
function loadProgram(vertex, fragment) {
  var program = gl.createProgram();
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragment);
  gl.compileShader(fragmentShader);
  if ( !gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    alert("Shader compilation failed: " + gl.getShaderInfoLog(fragmentShader));
  }
  gl.shaderSource(vertexShader, vertex);
  gl.compileShader(vertexShader);
  if ( !gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    alert("Shader compilation failed: " + gl.getShaderInfoLog(vertexShader));
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    alert("Program link error: " +
          gl.getProgramParameter(program, gl.VALIDATE_STATUS) +
          "\nERROR: " + gl.getError());
  }
  return program;
}
function windowResize() {
  cvs.width = window.innerWidth;
  cvs.height = window.innerHeight;
  gl.viewport(0, 0, cvs.width, cvs.height);
}
function render() {
  if (!gl) {
    return;
  }
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(D.currentProgram);
  updateCurrentTime();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.disableVertexAttribArray(0);
}
function findSceneForTime(time) {
  for(var i = 0; i < D.scenes.length; i++) {
    if (D.scenes[i].start <= time &&
        D.scenes[i].start + D.scenes[i].duration > time) {
      return i;
    }
  }
  throw "No scene found for time " + time;
}
function updateScene() {
  D.currentScene = findSceneForTime(D.currentTime);
  D.currentProgram = D.programs[D.currentScene];
}
function mainloop() {
  if (D.playState == D.PLAYING){
    if (D.currentTime <= D.endTime) {
      updateScene();
      requestAnimationFrame(mainloop);
      render();
      D.playState = D.PLAYING;
    } else {
      D.playState = D.ENDED;
    }
  }
}

function assertScenesSorted() {
  for (var i = 0; i < D.scenes - 1; i++) {
    if (!(D.scenes[i].startTime + D.scene[i].duration <= D.scenes[i+1].startTime)) {
      throw "Scenes not sorted in chronological order, aborting.";
    }
  }
}
window.addEventListener("resize", windowResize);

function ResourceLoader(callback) {
  this.toLoad = 0;
  this.loaded = 0;
  this.callback = callback;
};

ResourceLoader.prototype.onLoad = function () {
  if (++this.loaded == this.toLoad) {
    this.callback();
  }
}

ResourceLoader.prototype.registerResource = function(thing) {
  this.toLoad++;
}

function allLoaded() {
  for (var i = 0; i < D.scenes.length; i++) {
    var scene = D.scenes[i];
    D.programs.push(loadProgram(D.shaders[scene.vertex].src, D.shaders[scene.fragment].src));
  }

  D.startTime = Date.now();
  D.currentTime = 0;
  D.currentProgram = D.programs[0];
  D.currentScene = 0;
  var bs = ac.createBufferSource();
  var an = ac.createAnalyser();
  bs.buffer = D.sounds["think"];
  bs.loop = true;
  bs.connect(ac.destination);
  bs.connect(an);
  bd = new BeatDetector(an);
  bs.start(0);
  requestAnimationFrame(mainloop);
}

ResourceLoader.prototype.loadScript = function(src, type, id) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", src);
  var self = this;
  xhr.onload = function() {
    D.shaders[id] = { src: this.responseText, type: type};
    self.onLoad();
  };
  this.registerResource();
  xhr.send(null);
}

ResourceLoader.prototype.loadAudio = function(src, id) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", src);
  xhr.responseType = "arraybuffer";
  var self = this;
  xhr.onload = function() {
    ac.decodeAudioData(xhr.response, function(data) {
      D.sounds[id] = data;
      self.onLoad();
    }, function() {
      alert("error loading " + src + " " + "(" + id + ")");
    });
  };
  this.registerResource();
  xhr.send(null);
}

ac = new AudioContext();
var loader = new ResourceLoader(allLoaded);
loader.loadScript("green-red.fs", "x-shader/fragment", "green-red");
loader.loadScript("bw.fs", "x-shader/fragment", "bw");
loader.loadScript("quad.vs", "x-shader/vertex", "quad");
loader.loadAudio("think.wav", "think");

cvs = document.getElementsByTagName("canvas")[0];
gl = cvs.getContext("experimental-webgl");
buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
quad = new Float32Array([-1, -1,
                          1, -1,
                         -1,  1,
                          1, -1,
                          1,  1,
                         -1,  1]);
gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

windowResize();

seeker = document.getElementById("seeker");
document.addEventListener("input", function (e) {
  seek(e.target.value);
  seeker.value = e.target.value;
});

document.addEventListener("keypress", function(e) {
  // play/pause
  if (e.charCode == 32) {
    if (D.playState == D.PLAYING) {
      D.pauseStart = Date.now();
      D.playState = D.PAUSED;
    } else if(D.playState == D.ENDED) {
      seek(0);
    } else {
      D.startTime += Date.now() - D.pauseStart;
      D.playState = D.PLAYING;
      mainloop();
    }
  } else {
    // jump to scene
    var s = e.charCode - 48 - 1;
    if (s >= 0 && s <= 9 && s < D.scenes.length) {
      seek(D.scenes[s].start);
    }
  }
});

D.playState = D.PLAYING;
D.programs = [];

D.scenes = [
  { start: 0,
    duration: 5000,
    fragment: "green-red",
    vertex: "quad" },
  { start: 5000,
    duration: 15000,
    fragment: "bw",
    vertex: "quad" }
];

assertScenesSorted();

var lastScene = D.scenes[D.scenes.length - 1];
seeker.max = D.endTime = lastScene.start + lastScene.duration;
