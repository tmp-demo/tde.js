
var render_index = 0;

demo = {
  scenes: null,
  current_scene: null,
  current_time: 0,
  start_time: 0,
  end_time: 0,
  PAUSED: 0,
  PLAYING: 1,
  ENDED: 2,
  play_state: 1,
  looping: false,
  recording: false,
  editor:false,
  audiocontext: null
};


function main_loop() {
  if (demo.play_state == demo.PLAYING){
    if (demo.current_time <= demo.end_time) {
      demo.current_scene = find_scene_for_time(demo.current_time);
      demo.an.doFFT();
      update_time()
      render_scene(demo.current_scene);
      requestAnimationFrame(main_loop);

      if (demo.recording && render_index++ != 0) {
        recordFrame(cvs);
      }
      demo.playState = demo.PLAYING;
      update_text();
    } else {
      if (DEBUG) {
        console.log("demo ended");
      }
      demo.play_state = demo.ENDED;
      if (demo.recording) {
        stichFramesForDownload();
      }
      //bs.stop(0);
    }
  }
}

function main() {
  console.log("main");
  init_audio(demo);
  prepare();
  loader_init(function(){
    gl_init();
    demo_init();
    gfx_init();
    time_init();

    if (demo.editor) { editior_init(); }

    demo.audio_source.start(0);
    main_loop();
  });
}

function update_text() {
  //look for existing text that could be out of date
  //look for curently inexisting text that should be displayed
  if (demo.Texts) {
    for(var i = 0; i < demo.Texts.length; i++){
      var ct = demo.Texts[i];
      if(ct.instance !== null && ( demo.current_time < ct.start || demo.current_time > ct.end)){
        //remove it !
        removeText(ct.instance);
        ct.instance = null;
      } else if(ct.instance == null && ( demo.currentTime > ct.start && demo.currentTime < ct.end)) {
        //add it !
        ct.instance = addText(ct.text, ct.top, ct.left, ct.classname);
      }
    }    
  }
}
