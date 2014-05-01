function find_scene_for_time(time) {
  var i = 0;
  while ((demo.scenes[i].end_time < time) && (i + 1 < demo.scenes.length))
    i++;

  return demo.scenes[i];
}

function update_time() {
  demo.current_time = audioContext.currentTime * 1000 - demo.start_time;
  demo.clip_time = demo.current_time - demo.current_scene.start;
}

function time_init() {
  // compute start tinme for each scene
  var time_sum = 0;
  for (var s=0;s<demo.scenes.length;++s) {
      demo.scenes[s].start_time = time_sum;
      time_sum += demo.scenes[s].duration;
      demo.scenes[s].end_time = time_sum;
  }
  demo.end_time = time_sum;
}
