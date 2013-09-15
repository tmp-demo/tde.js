
function seek(time) {
/*
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
*/
  demo.start_time = audio.context.currentTime * 1000 - time;
  demo.current_time = time;
  demo.current_scene = find_scene_for_time(time);
  if (demo.play_state == demo.PAUSED) {
    //updateScene();
    render_scene(demo.current_scene);
  } else {
    //drumsTrack.start(0, D.currentTime / 1000);
    //otherTrack.start(0, D.currentTime / 1000);
  }
  if (demo.play_state == demo.ENDED) {
    demo.play_state = demo.PLAYING;
    main_loop();
  }
}

function find_scene_for_time(time) {
  var scene = demo.current_scene;

  if (demo.looping){
    if(scene.start + scene.duration < time) {
      seek(scene.start_time);
    } else if(scene.start_time > time) {
      seek(scene.start_time);
    }
    return demo.current_scene;
  } else {
    for(var i = 0; i < demo.scenes.length; i++) {
      if (demo.scenes[i].start_time <= time &&
          demo.scenes[i].start_time + demo.scenes[i].duration > time) {
        return demo.scenes[i];
      }
    }
  }
  throw "No scene found for time " + time;
}


function update_time() {
  demo.current_time = audio.context.currentTime * 1000 - demo.start_time;
  if (seeker) { seeker.value = demo.current_time; } //#OPT
  demo.clip_time = demo.current_time - demo.current_scene.start;
}


function time_init() {
  console.log("time_init");

  seeker = document.getElementById("seeker");
  seeker.addEventListener("input", function (e) {
    seek(e.target.value);
    seeker.value = e.target.value;
    demo.looping = false;
  });

  // compute start tinme for each scene
  var time_sum = 0;
  for (var s=0;s<demo.scenes.length;++s) {
      demo.scenes[s].start_time = time_sum;
      time_sum += demo.scenes[s].duration;
  }
  demo.end_time = time_sum;
  if (seeker) { seeker.max = time_sum; }
}
