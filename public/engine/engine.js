var scenes = [];
var start_time = 0;
var snd;
var M = Math;

var symbolMap = {} // #debug

function minify_context(ctx)
{
  var names = []
  for (var name in ctx) names.push(name);
  names.sort();
  
  for (var i in names)
  {
    var name = names[i]
    
    var m, newName = "";
    var re = /([A-Z0-9])[A-Z]*_?/g;
    if (name.match(/[a-z]/))
      re = /(^[a-z]|[A-Z0-9])[a-z]*/g;
    while (m = re.exec(name)) newName += m[1];
    
    if (newName in ctx)
    {
      var index = 2;
      while ((newName + index) in ctx) index++;
      newName = newName + index;
    }
    
    ctx[newName] = ctx[name];
    
    // #debug{{
    // don't minify properties that are neither objects nor constants (or that map to strings)
    var preservedNames = ["canvas", "currentTime", "font", "fillStyle", "globalCompositeOperation", "lineWidth"]
    if (preservedNames.indexOf(name) != -1)
      continue;
    
    if (name in symbolMap)
    {
      if (symbolMap[name] != newName)
      {
        alert("Symbol " + name + " packed differently for multiple contexts (" + symbolMap[name] + ", " + newName + ")");
      }
    }
    symbolMap[name] = newName;
    // #debug}}
  }
}

// export for minifcation tools
// #debug{{
function dump_symbol_map()
{
  console.log(symbolMap);
  $(document.body).text(JSON.stringify(symbolMap));
}
// #debug}}

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
  var current_time = snd.t();
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

  snd = new SND(SONG);
  // If you want to shut the music up comment this out and also comment
  // out the equivalent line in engine-driver.js:~100
  snd.p();

  main_loop();
}

function editor_main() {
  canvas = document.getElementById("engine-view")
  gl_init();
}
