
//var render_index = 0;

demo = {
  scenes: [],
  start_time: 0
};

function main_loop() {
  var current_time = audioContext.currentTime - demo.start_time;
  
  var start_time = 0;
  for (var i = 0; i < demo.scenes.length; i++) {
    var scene = demo.scenes[i]
    var scene_time = current_time - start_time;
    if ((scene_time >= 0) && (scene_time < scene.duration)) {
      render_scene(scene, current_time, scene_time);
      break;
    }
    
    start_time += scene.duration;
  }
  
  requestAnimationFrame(main_loop);
  
  // reload all geometry that has reaload set to true
  /*for (var g in geometries) {
    if (geometries[g].reload === true) {
      upload_geom(geometries[g]);
      geometries[g],reload = false;
    }
  }

  if (demo.play_state == demo.PLAYING){
    if (demo.current_time <= demo.end_time) {
      demo.current_scene = find_scene_for_time(demo.current_time);
      demo.an.doFFT();
      update_time()
      render_scene(demo.current_scene);
      requestAnimationFrame(main_loop);

      // #debug{{
      if (demo.recording && render_index++ != 0) {
        recordFrame(cvs);
      }
      // #debug}}
      demo.playState = demo.PLAYING;
    } else {
      console.log("demo ended"); //#debug
      demo.play_state = demo.ENDED;
      if (demo.recording) {
        stichFramesForDownload();
      }
    }
  }*/
}

function main() {
  var body = document.body
  body.innerHTML = "";
  canvas = document.createElement("canvas");
  body.appendChild(canvas);
  body.style.margin = 0;
  
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  
  gl_init();
  demo_init();
  gfx_init();

  render_scene(demo.scenes[0], 0, 0);
  init_audio();

  main_loop();
}

function editor_main() {
  canvas = document.getElementById("engine-view")
  
  init_audio();
  gl_init();

  main_loop();
}
