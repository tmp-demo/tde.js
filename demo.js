function $(s) {
  return document.querySelector(s);
}

function $$(s) {
  return document.querySelectorAll(s);
}

var frames = [];

function recordFrame(cvs) {
  cvs.toBlob(function(blob) {
    frames.push(blob);
  });
}

function stichFramesForDownload()
{
  var blob = new Blob(frames,  {type: "application/octet-binary"});
  var url = URL.createObjectURL(blob);
  location.href = url;
}

function BeatDetector(analyserNode) {
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

BeatDetector.prototype.beat = function(a) {
  this.node.getFloatFrequencyData(this.array);
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

seeker = null;
/* gl context */
gl = null;
/* canvas */
cvs = null;
/* audio context */
ac = null;
/* beat detector */
bd = null;
/* buffersource */
drumsTrack = null;
otherTrack = null;
/* analysernode */
an = null;
/* vertex buffer for our quad */
buffer = null;
vizbeats = null;

/*frame buffer for the post processing*/
fbo = null;
texture = null;

D = {
  /* time in ms */
  currentTime: 0,
  startTime: 0,
  endTime: 0,
  PAUSED: 0,
  PLAYING: 1,
  ENDED: 2,  
  looping: false,
  playState: null,
  scenes: [],
  programs: [],
  currentScene: null,
  currentProgram: null,
  shaders: {},
  sounds: {},
  scenesShortcuts : {"97":0, "122":1,"101":2, "114":3,"116":4,"116":5,"121":6,"117":7,"105":8,"111":9},
  scenesLoopShortcuts : {"113":0, "115":1,"100":2, "102":3,"103":4,"104":5,"106":6,"107":7,"108":8,"109":9},
  recoding: false,
};

function updateTimes() {
  D.currentTime = ac.currentTime * 1000 - D.startTime;
  seeker.value = D.currentTime;

  D.clipTime = D.currentTime - D.scenes[D.currentScene].start;
}

function updateTimeUniforms(program) {
  gl.uniform1f(gl.getUniformLocation(program, 'time'),
               D.currentTime - D.scenes[D.currentScene].start);
  gl.uniform1f(gl.getUniformLocation(program, 'duration'),
               D.scenes[D.currentScene].duration);
  gl.uniform2f(gl.getUniformLocation(program, 'res'),
               cvs.width, cvs.height);
               var a;
  gl.uniform1f(gl.getUniformLocation(program, 'beat'),
               bd.beat());
}

function seek(time) {
  if (drumsTrack) {
    drumsTrack.stop(0);
    drumsTrack = null;
    otherTrack.stop(0);
    otherTrack = null;
  }
  drumsTrack = ac.createBufferSource();
  drumsTrack.buffer = D.sounds["drums"];
  drumsTrack.connect(ac.destination);
  drumsTrack.connect(an);
  otherTrack = ac.createBufferSource();
  otherTrack.buffer = D.sounds["synths"];
  otherTrack.connect(ac.destination);
  D.startTime = ac.currentTime * 1000 - time;
  D.currentTime = time;
  D.currentScene = findSceneForTime(D.currentTime);
  if (D.playState == D.PAUSED) {
    updateScene();
    D.render();
  } else {
    drumsTrack.start(0, D.currentTime / 1000);
    otherTrack.start(0, D.currentTime / 1000);
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

function updateDefault(program) {
  updateTimes();
  updateTimeUniforms(program);
}

function renderDefault() {

  //first remove any attached texture
  gl.bindTexture(gl.TEXTURE_2D, null);

  //TODO : test if there is any post processing to do
  if(D.currentProgram.length > 1){//there is some post process available
    
    //bind the temp frame buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    
    //load the program
    gl.useProgram(D.currentProgram[0]);
    
    // do the job
    // updateTimeUniforms();
    D.scenes[D.currentScene].update[0](D.currentProgram[0]);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    //TODO : write logic for several post...
    // do the post processing
    gl.useProgram(D.currentProgram[1]);
    D.scenes[D.currentScene].update[1](D.currentProgram[1]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    //clean up
    gl.disableVertexAttribArray(0);
  
  }else{
    //bind the final frame buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    //load the program
    gl.useProgram(D.currentProgram[0]);
    
    // do the job
    D.scenes[D.currentScene].update[0](D.currentProgram[0]);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); 
    gl.enableVertexAttribArray(0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
	
	//clean up
    gl.disableVertexAttribArray(0);
  }

  
}

function createAndSetupTexture(gl) {
  var texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);//this texture is used to store render output for post process.

  // Set up texture so we can render any size image and so we are
  // working with pixels.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  return texture;
}

function renderScene() {
  if (!gl) {
    return;
  }
  D.render();
}

function findSceneForTime(time) {
  if (D.looping){
    if(D.scenes[D.currentScene].start + D.scenes[D.currentScene].duration < time) {
      seek(D.scenes[D.currentScene].start);
    } else if(D.scenes[D.currentScene].start > time) {
      seek(D.scenes[D.currentScene].start);
    }
    return D.currentScene;
  } else {
    for(var i = 0; i < D.scenes.length; i++) {
      if (D.scenes[i].start <= time &&
          D.scenes[i].start + D.scenes[i].duration > time) {
        return i;
      }
    }
  }
  throw "No scene found for time " + time;
}
function updateScene() {
  D.currentScene = findSceneForTime(D.currentTime);
  D.currentProgram = D.programs[D.currentScene];
  D.render = renderDefault; // TODO[nical]
  if (D.render === undefined) {
    D.render = renderDefault;
  }
}
function updateText(){
  //look for existing text that could be out of date
  //look for curently inexisting text that should be displayed
  for(var i = 0; i < D.Texts.length; i++){
    var ct = D.Texts[i];
    if(ct.instance !== null && ( D.currentTime < ct.start || D.currentTime > ct.end)){
      //remove it !
      removeText(ct.instance);
      ct.instance = null;
    } else if(ct.instance == null && ( D.currentTime > ct.start && D.currentTime < ct.end)) {
      //add it !
      ct.instance = addText(ct.text, ct.top, ct.left ,ct.classname);
    }
  }
}

var render_index = 0;

function mainloop() {
  if (D.playState == D.PLAYING){
    if (D.currentTime <= D.endTime) {
      updateScene();
      requestAnimationFrame(mainloop);
      renderScene();
      if (D.recording && render_index++ != 0) {
        recordFrame(cvs);
      }
      D.playState = D.PLAYING;
      updateText();
    } else {
      D.playState = D.ENDED;
      if (D.recording) {
        stichFramesForDownload();
      }
      //bs.stop(0);
    }
  }
}

function assertScenesSorted() {
  for (var i = 0; i < D.scenes - 1; i++) {
    if (!(D.scenes[i].startTime + D.scene[i].duration == D.scenes[i+1].startTime)) {
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

function concat(names) {
  var src = "";
  for (var i in names) {
    src += D.texts[names[i]];
  }
  return src;
}

function allLoaded() {
  loadScenes();

  D.shaders["city_1"] = {
    src: concat([
    "city_uniforms",
    "city_distance_1",
    "city_marcher",
    "city_mtl_1",
    "city_post_1",
    "city_main"
    ])
  };

  D.shaders["city_rainbow"] = {
    src: concat([
    "city_uniforms",
    "city_distance_1",
    "city_marcher",
    "city_mtl_rainbowtransition",
    "city_post_1",
    "city_main"
    ])
  };

  D.shaders["city_intro"] = {
    src: concat([
    "city_uniforms",
    "city_distance_1",
    "city_marcher",
    "city_mtl_intro",
    "city_post_1",
    "city_main"
    ])
  };

  D.shaders["city_2"] = {
    src: concat([
    "city_uniforms",
    "city_distance_1",
    "city_marcher",
    "city_mtl_2",
    "city_post_1",
    "city_main"
    ])
  };

  D.shaders["city_fancy"] = {
    src: concat([
    "city_uniforms",
    "city_distance_1",
    "city_marcher",
    "city_mtl_multicolor",
    "city_post_1",
    "city_main"
    ])
  };

  for (var i = 0; i < D.scenes.length; i++) {
    var scene = D.scenes[i];
    D.programs[i] = [];
    for(var j = 0; j < D.scenes[i].fragments.length; j++)
      D.programs[i].push(loadProgram(D.shaders[scene.vertex].src, D.shaders[scene.fragments[j]].src));
  }

  if (window.AudioContext) {
    ac = new AudioContext();
  } else {
    ac = new webkitAudioContext();
  }
  D.startTime = 0;
  D.currentTime = 0;
  D.currentProgram = D.programs[0];
  D.render = renderDefault;
  D.currentScene = 0;
  drumsTrack = ac.createBufferSource();
  otherTrack = ac.createBufferSource();
  an = ac.createAnalyser();
  an.fftSize = 512;
  drumsTrack.buffer = D.sounds["drums"];
  drumsTrack.connect(ac.destination);
  drumsTrack.connect(an);
  otherTrack.buffer = D.sounds["synths"];
  otherTrack.connect(ac.destination);
  bd = new BeatDetector(an);
  drumsTrack.start(0);
  otherTrack.start(0);
  if (D.recording) {
    var r = document.createElement("div");
    r.className = "recording";
    document.body.appendChild(r);
  }
  requestAnimationFrame(mainloop);
}

ResourceLoader.prototype.loadShader = function(src, type, id) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", src);
  var self = this;
  xhr.onload = function() {
    D.shaders[id] = { src: this.responseText, type: type};
    console.log("loaded: " + src);
    self.onLoad();
  };
  xhr.onerror = function() {
    alert("loadShader error."+src);
  }
  this.registerResource();
  xhr.send(null);
}

ResourceLoader.prototype.loadText = function(src, id) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", src);
  var self = this;
  xhr.onload = function() {
    D.texts[id] = this.responseText;
    console.log("loaded: " + src);
    self.onLoad();
  };
  xhr.onerror = function() {
    alert("loadText error."+src);
  }
  this.registerResource();
  xhr.send(null);
}

ResourceLoader.prototype.loadJS = function(url) {
  var e = document.createElement("script");
  e.src = url;
  var self = this;
  e.addEventListener("load", function() {
    console.log("loaded: " + url);
    self.onLoad();
  });
  e.addEventListener("error", function() {
    alert("loadJS error: "+url);
  });
  this.registerResource();
  document.body.appendChild(e);
}

ResourceLoader.prototype.loadAudio = function(src, id) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", src);
  xhr.responseType = "arraybuffer";
  var self = this;
  xhr.onload = function() {
    console.log("loaded: " + src);
    ac.decodeAudioData(xhr.response, function(data) {
      console.log("decoded: " + src);
      D.sounds[id] = data;
      self.onLoad();
    }, function() {
      alert("error loading " + src + " " + "(" + id + ")");
    });
  };
  xhr.onerror = function() {
    alert("loadAudio error.");
  }
  this.registerResource();
  xhr.send(null);
}

if (window.AudioContext) {
  ac = new AudioContext();
} else {
  ac = new webkitAudioContext();
}

if (window.location.search.startsWith("?recording")) {
  D.recording = true;
}

var loader = new ResourceLoader(allLoaded);
loader.loadJS("glmatrix.js");
loader.loadJS("raymarch.js");
loader.loadJS("scenes.js");
loader.loadShader("green-red.fs", "x-shader/fragment", "green-red");
loader.loadShader("bw.fs", "x-shader/fragment", "bw");
loader.loadShader("blur.fs", "x-shader/fragment", "blur");
loader.loadShader("chroma.fs", "x-shader/fragment", "chroma");
loader.loadShader("gay-flag.fs", "x-shader/fragment", "gay-flag");
loader.loadShader("gay-ring.fs", "x-shader/fragment", "gay-ring");
loader.loadShader("gay-ring2.fs", "x-shader/fragment", "gay-ring2");
loader.loadShader("gay-ring3.fs", "x-shader/fragment", "gay-ring3");
loader.loadShader("marcher1.fs", "x-shader/fragment", "marcher1");
loader.loadShader("quad.vs", "x-shader/vertex", "quad");

loader.loadText("city_uniforms.fs", "city_uniforms");
loader.loadText("city_mtl_1.fs", "city_mtl_1");
loader.loadText("city_mtl_2.fs", "city_mtl_2");
loader.loadText("city_mtl_rainbowtransition.fs", "city_mtl_rainbowtransition");
loader.loadText("city_mtl_multicolor.fs", "city_mtl_multicolor");
loader.loadText("city_mtl_intro.fs", "city_mtl_intro");
loader.loadText("city_distance_1.fs", "city_distance_1");
loader.loadText("city_marcher.fs", "city_marcher");
loader.loadText("city_main.fs", "city_main");
loader.loadText("city_post_1.fs", "city_post_1");

loader.loadAudio("drums.ogg", "drums");
loader.loadAudio("synths.ogg", "synths");

cvs = document.getElementsByTagName("canvas")[0];
gl = cvs.getContext("experimental-webgl", {preserveDrawingBuffer: true});



windowResize();

buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
quad = new Float32Array([-1, -1,
                          1, -1,
                         -1,  1,
                          1, -1,
                          1,  1,
                         -1,  1]);
gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);


texture = createAndSetupTexture(gl);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, cvs.width, cvs.height, 0,
              gl.RGBA, gl.UNSIGNED_BYTE, null);

fbo = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
quad = new Float32Array([-1, -1,
                          1, -1,
                         -1,  1,
                          1, -1,
                          1,  1,
                         -1,  1]);
gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

seeker = document.getElementById("seeker");
seeker.addEventListener("input", function (e) {
  console.log("seek to " + e.target.value);
  seek(e.target.value);
  seeker.value = e.target.value;
  D.looping = false;
});

document.addEventListener("keypress", function(e) {
  // play/pause
  if (e.charCode == 32) {
    if (D.playState == D.PLAYING) {
      D.playState = D.PAUSED;
      drumsTrack.stop(0);
      otherTrack.stop(0);
    } else if(D.playState == D.ENDED) {
      seek(0);
    } else {
      D.playState = D.PLAYING;
      seek(D.currentTime);
      mainloop();
    }
  } else if(e.charCode == 8) { //backspace key
    D.looping = false;
  } else if(typeof D.scenesShortcuts[e.charCode]  !== 'undefined' ) {
    // jump to scene
    if (D.scenesShortcuts[""+e.charCode] < D.scenes.length){//s >= 0 && s <= 9 && s < D.scenes.length) {
      D.looping = false;
      seek(D.scenes[D.scenesShortcuts[""+e.charCode]].start);
    }
  } else if (typeof D.scenesLoopShortcuts[e.charCode]  !== 'undefined' ) {
    // jump to scene
    if (D.scenesLoopShortcuts[""+e.charCode] < D.scenes.length){//s >= 0 && s <= 9 && s < D.scenes.length) {
      D.looping = true;
      D.currentScene = D.scenesLoopShortcuts[""+e.charCode];
      seek(D.scenes[D.currentScene].start);
    }
  }
});

D.playState = D.PLAYING;
D.programs = [];
D.scenes = [];
D.texts = {};

