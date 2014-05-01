
var render_index = 0;

demo = {
  scenes: null,
  current_scene: null,
  current_time: 0,
  start_time: 0,
  end_time: 0
};

function main_loop() {
  if (demo.current_time <= demo.end_time) {
    demo.current_scene = find_scene_for_time(demo.current_time);
    update_time()
    render_scene(demo.current_scene);
    requestAnimationFrame(main_loop);
  }
  
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
  document.body.innerHTML = "";
  canvas = document.createElement("canvas");
  document.body.appendChild(canvas);
  
  init_audio();
  prepare();
  canvas.width = demo.w;
  canvas.height = demo.h;
  gl_init();
  demo_init();
  gfx_init();
  time_init();

  render_scene(demo.scenes[0]);
  init_audio();

  // #debug{{
  if (window.editor_init) { editor_init(); }
  // #debug}}
  main_loop();
}

function editor_main() {
  canvas = document.getElementById("engine-view")
  init_audio();
  prepare();
  gl_init();
  demo_init();
  gfx_init();
  time_init();

  main_loop();
}
