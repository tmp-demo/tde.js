var audioContext;

function init_audio() {
  if (AudioContext) {
    audioContext = new AudioContext();
  } else {
    audioContext = new webkitAudioContext();
  }
  
  var osc = audioContext.createOscillator()
  osc.connect(audioContext.destination)
  osc.start()
}
