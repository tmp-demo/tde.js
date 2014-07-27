var scenes = [];
var start_time = 0;

function engine_render(current_time)
{
  var start_time = 0;
  for (var i = 0; i < scenes.length; i++) {
    var scene = scenes[i]
    var scene_time = current_time - start_time;
    if ((scene_time >= 0) && (scene_time < scene.duration)) {
      render_scene(scene, current_time, scene_time);
      break;
    }

    start_time += scene.duration;
  }
}

function main_loop() {
  var current_time = audioContext.currentTime - start_time;
  engine_render(current_time);
  requestAnimationFrame(main_loop);
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

  render_scene(scenes[0], 0, 0);
  init_audio();

  main_loop();
}

function editor_main() {
  canvas = document.getElementById("engine-view")

  init_audio();
  gl_init();
}
