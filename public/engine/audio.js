var audioContext;

function init_audio() {
  if (AudioContext) {
    audioContext = new AudioContext();
  } else {
    audioContext = new webkitAudioContext();
  }
  
  var osc = audioContext.createOscillator()
  var gain = audioContext.createGain()
  gain.gain.value = 0
  osc.connect(gain)
  gain.connect(audioContext.destination)
  osc.start(0)
}
