  // change that to true to log
  function log() {
    // console.log.apply(console, arguments);
  }
  function editing() { return false; }
  function n2f(n) {
    return M.pow(2, (n - 69) / 12) * 440;
  }

  AudioNode.prototype.c = AudioNode.prototype.connect;

  ac = new AudioContext();
  minify_context(ac);

  /** @constructor */
  function SND() {
    log('SND.constr', this);
    this.playing = false;
  };
  
  SND.AD = function(p/*aram*/, l/*start*/, u/*end*/, t/*startTime*/, a/*attack*/, d/*decay*/) {
    p.setValueAtTime(l, t);
    p.linearRampToValueAtTime(u, t + a);
    // XXX change that to setTargetAtTime
    p.linearRampToValueAtTime(l, t + d);
  };
  SND.D = function(p, t, v, k) {
    p.value = v;
    p.setValueAtTime(v, t);
    p.setTargetAtTime(0, t, k);
  }
  SND.DCA = function(i, v, t, a, d) {
    var g = ac.createGain();
    i.c(g);
    SND.AD(g.gain, 0, v, t, a, d);
    return g;
  };
  function NoiseBuffer() {
    var i,l;
    if (!SND._noisebuffer) {
      SND._noisebuffer = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate / 2);
      var cdata = SND._noisebuffer.getChannelData(0);
      for(i=0,l=cdata.length;i<l;i++) {
        cdata[i] = M.random() * 2.0 - 1.0;
      }
    }
    return SND._noisebuffer;
  }
  SND.ReverbBuffer = function(opts) {
    var i,l;
    var len = ac.sampleRate * opts.l
    var buffer = ac.createBuffer(2, len, ac.sampleRate)
    for(i=0,l=buffer.length;i<l;i++) {
      var s =  M.pow(1 - i / len, opts.d);
      buffer.getChannelData(0)[i] = (M.random() * 2 - 1)*2;
      buffer.getChannelData(1)[i] = (M.random() * 2 - 1)*2;
    }
    return buffer;
  }

  SND.DistCurve = function(k) {
    var c = new Float32Array(ac.sampleRate);
    var deg = M.PI / 180;
    for (var i = 0; i < c.length; i++) {
      var x = i * 2 / c.length - 1;
      c[i] = (3 + k) * x * 20 * deg / (M.PI + k * M.abs(x));
    }
    return c;
  }
  SND.setSends = function(sendGains, out) {
    sends.forEach(function(send, i) {
      var amp = ac.createGain();
      amp.gain.value = sendGains[i] || 0.0;
      out.c(amp);
      amp.c(send);
    });
  };

  // In fractional beat
  SND.prototype.t = function() {
    return (ac.currentTime - this.startTime) * (125/ 60);
  }

  SND.prototype.p = function() {
    if (this.playing == true) return;
    if (!this.startTime) this.startTime = ac.currentTime;
    var stepTime = 15 / 125,
        patternTime = stepTime * 64,
        currentTime = ac.currentTime;

    this.currentPos = 0;
    if (editing()) {
      // the patter to loop, or -1 to just play the track
      this.loop = this.loop != undefined ? this.loop : -1;
      // start at the loop if specified, beginning otherwise
      this.currentPos = this.loop != -1 ? this.loop : 0;
    }

    this.playing = true;

    var patternScheduler = (function() {
      if (this.playing == false) return;
      if (currentTime - ac.currentTime < (patternTime / 4)) {
        SND.st = [];
        for(i=0;i<64;i++) { SND.st[i] = currentTime + (stepTime * i); }
        if (SONG.playlist.length == this.currentPos) {
          return;
        }
        var cP = SONG.playlist[this.currentPos];
        log(cP);
        for (var instrId in cP) {
          if (cP.hasOwnProperty(instrId)) {
            log("scheduling", cP[instrId], "for", instrId)
            var data = SONG.patterns[cP[instrId]];
            SND.playPattern(instruments[instrId], SND.st, stepTime, data); 
          }
        }
        if (editing()) {
          if (this.loop == -1) {
            this.currentPos = (this.currentPos + 1) % SONG.playlist.length;
          } else {
            this.currentPos = this.loop;
          }
        } else{
          this.currentPos++;
        }
        currentTime += patternTime;
      }
      setTimeout(patternScheduler, 1000);
    }).bind(this);
    patternScheduler();
  };
  SND.prototype.s = function() {
    this.playing = false;
  }
  
  // SEND EFFECTS
  
  /** @constructor */
  SND.DEL = function() {
    var opts = {t: 0.36, fb: 0.4, m: 0.6, f: 800, q: 2};
    var delay = ac.createDelay();
    delay.delayTime.value = opts.t;
    var fb = ac.createGain();
    var flt = ac.createBiquadFilter();
    flt.type = 'highpass';
    flt.frequency.value = opts.f;
    flt.Q.value = opts.q;
    fb.gain.value = opts.fb;
    var mix = ac.createGain();
    mix.gain.value = opts.m;
    delay.c(mix);
    delay.c(flt);
    flt.c(fb);
    fb.c(delay);
    mix.c(ac.destination);
    return delay;
  }
  
  /** @constructor */
  SND.REV = function() {
    var opts = {d: 0.05, m: 1};
    var cnv = ac.createConvolver();
    var mix = ac.createGain();
    cnv.buffer = SND.ReverbBuffer({l: 2, d: opts.d});
    mix.gain.value = opts.m;
    cnv.c(mix);
    mix.c(ac.destination);
    return cnv;
  }

  /** @constructor */
  SND.DIST = function() {
    var ws = ac.createWaveShaper();
    mix = ac.createGain();
    ws.curve = SND.DistCurve(50);
    mix.gain.value = 0.5;
    ws.c(mix);
    mix.c(ac.destination);
    return ws;
  }
  
  // INSTRUMENTS
  
  SND.playPattern = function(instrument, times, stepTime, data) {
    times.forEach(function(t, i) {
      note = data[i];
      if (typeof(note) !== 'object') {
        note = [note, {}]
      }
      if (note[0] != 0) {
        instrument(t, stepTime, note);
      }
    });
  };
  
  var noise = NoiseBuffer();
  SND.Noise = function(t) {
    var smp = ac.createBufferSource();
    var flt = ac.createBiquadFilter();
    smp.c(flt);
    var amp = SND.DCA(flt, 0.1, t, 0.001, 0.06);
    flt.frequency.value = 8000;
    flt.type = "highpass";
    flt.Q.value = 8;
    smp.buffer = noise;
    smp.c(amp);
    SND.setSends([0.3], amp);
    amp.c(ac.destination);
    smp.start(t);smp.stop(t + 0.06);
  }
  
  SND.Drum = function(t) {
    var osc = ac.createOscillator();
    var click = ac.createOscillator();
    click.type = "square";
    click.frequency.value = 40;

    // SND.AD(osc.frequency, opts.en, opts.st, t, 0, opts.k * 8);
    osc.frequency.value = 90;
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.setTargetAtTime(50, t+0.001, 0.03)

    function d(o, e){
      var amp = ac.createGain();
      o.c(amp);
      SND.D(amp.gain, t, 1.3, e);
      amp.c(ac.destination);
    }

    d(osc, 0.03)
    d(click, 0.005)

    osc.start(t);osc.stop(t + 0.2);
    click.start(t);click.stop(t + 0.009);
  }

  SND.Snare = function(t) {
    var f = [111 + 175, 111 + 224];
    var o = [];

    // filter for noise and osc
    var fl = ac.createBiquadFilter();
    // fl.type = "lowpass" // default
    fl.frequency.value = 3000;

    // amp for oscillator
    var amposc = ac.createGain();
    SND.D(amposc.gain, t, 0.4, 0.015);

    // two osc
    f.forEach(function(e, i) {
      o[i] = ac.createOscillator();
      o[i].type = "triangle";
      o[i].frequency.value = f[i];
      o[i].c(amposc);
      o[i].start(t); o[i].stop(t + 0.4);
    })

    // noise
    var smp = ac.createBufferSource();
    smp.buffer = noise;
    var ampnoise = ac.createGain();
    smp.c(ampnoise);
    SND.D(ampnoise.gain, t, 0.24, 0.045);
    smp.start(t);smp.stop(t + 0.1);

    ampnoise.c(fl);
    amposc.c(fl);

    SND.setSends([0.3, 0.2], fl);
    fl.c(ac.destination);
  }
  
  SND.Synth = function(t, stepTime, data) {
    var osc = ac.createOscillator();
    var flt = ac.createBiquadFilter();
    flt.Q.value = 2;
    osc.frequency.value = n2f(data[0]);
    osc.type = "square"
    len = stepTime * (data[1].l || 1);
    osc.c(flt);
    var amp = SND.DCA(flt, data[1].v || 0.1, t, 0.01, len);
    SND.setSends([0.5, 0.6], amp);
    amp.c(ac.destination);
    SND.AD(flt.frequency, 200, 2000, t, 0.01, len / 2);
    osc.start(t);osc.stop(t + len);
  }

  SND.Sub = function(t, stepTime, data) {
    var osc = ac.createOscillator();
    osc.frequency.value = n2f(data[0]);
    len = stepTime * data[1].l;
    // len = stepTime * (data[1].l || 1);
    var amp = SND.DCA(osc, 0.6, t, 0.05, len);
    amp.c(ac.destination);
    osc.start(t);osc.stop(t + len);
  }

  SND.Reese = function(t, stepTime, data) {
    var note = data[0];
    var len = stepTime * data[1].l;

    var flt = ac.createBiquadFilter();
    var o = ac.createOscillator();
    o.frequency.value = data[1].f * (125 / 120); // fetch tempo here.
    var s = ac.createGain();
    s.gain.value = 8000;
    o.c(s);
    s.c(flt.frequency);
    o.start(t); o.stop(t + 10); // long tail
    amp = SND.DCA(flt, data[1].v, t, 0, len);
    for (var i = 0; i < 2; i++) {
      o = ac.createOscillator();
      o.frequency.value = n2f(note);
      o.type = "square";
      o.detune.value = i * 50;
      o.c(flt);
      o.start(t);o.stop(t+len);
    }
    amp.c(ac.destination)
    SND.setSends([0,0.4,1], amp);
  }

  SND.Glitch = function(t, stepTime, data) {
    var len = (data[1].l || 1) * stepTime;
    var source = ac.createBufferSource();
    var end = t + len;
    var sources = [];
    var i = 0;
    var sink = ac.createGain();
    sink.gain.value = 0.05;
    while (t < end) {
      sources[i] = ac.createBufferSource();
      sources[i].buffer = noise;
      sources[i].loop = true;
      sources[i].loopStart = 0;
      sources[i].loopEnd = M.random() * 0.05;
      sources[i].start(t);
      t += M.random() * 0.5;
      t = M.min(t, end);
      sources[i].stop(t);
      sources[i].c(sink);
      i++;
    }
    sink.c(ac.destination);
    SND.setSends([0.3, 0.8], sink);
  }





////////////////// Audio tag implementation

function SND_Ogg(name, data)
{
  var src, audioElement;

  if (data)
    src = "/data/project/tdf15/asset/" + name + ".ogg"
  else
    src = "tdf15/" + name + ".ogg"

  var audioElement = new Audio(src)

  this.p = function()
  {
    console.log("play!")
    audioElement.play();
  }

  this.s = function()
  {
    audioElement.pause();
  }

  this.t = function()
  {
    return audioElement.currentTime * (173.43 / 60);
  }

  this.seek = function(beat)
  {
    audioElement.currentTime = beat * 60 / 173.43
  }
}
