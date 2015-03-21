var sequence = [];
var snd;

if (config.EDITOR) {
  var symbolMap = {}
}

function minify_context(ctx)
{
  Object.keys(ctx).sort().forEach(function(name) {
    if (config.EDITOR) {
      var shader = false
      if (name.match(/^shader_/))
      {
        shader = true;
        name = name.substr(7);
      }
    }
      
    var m, newName = "";  
    var re = (name.match(/[a-z]/) ? /(^[a-z]|[A-Z0-9])[a-z]*/g : /([A-Z0-9])[A-Z]*_?/g);
    while (m = re.exec(name)) newName += m[1];
    
    // add an underscore to shader variables, to avoid conflict with glsl-unit minification
    if (config.EDITOR) {
      if (shader)
        newName = "_" + newName;
    }
    
    if (newName in ctx)
    {
      var index = 2;
      while ((newName + index) in ctx) index++;
      newName = newName + index;
    }
    
    ctx[newName] = ctx[name];
    
    if (config.EDITOR) {
      // don't minify properties that are neither objects nor constants (or that map to strings)
      var preservedNames = ["canvas", "currentTime", "destination", "font", "fillStyle", "globalCompositeOperation", "lineWidth"]
      if (preservedNames.indexOf(name) !== -1)
        return;
      
      if (name in symbolMap)
      {
        if (symbolMap[name] != newName)
        {
          alert("Symbol " + name + " packed differently for multiple contexts (" + symbolMap[name] + ", " + newName + ")");
        }
      }
      symbolMap[name] = newName;
    }
  })
}

// export for minifcation tools
function dump_symbol_map()
{
  if (!config.EDITOR)
    return;
  
  console.log(symbolMap);
  $(document.body).text(JSON.stringify(symbolMap));
}

function engine_render(current_time)
{
  render_sequence(sequence, current_time)
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
  text_init();

  load_shaders();
  load_geometries();
  load_scenes();
  load_textures();

  gfx_init();

  //snd = new SND(SONG);
  snd = new SND_Ogg("tdf15_master3")
  // If you want to shut the music up comment this out and also comment
  // out the equivalent line in engine-driver.js:~100
  snd.p();

  main_loop();
}

function editor_main() {
  canvas = document.getElementById("engine-view")
  gl_init();
  text_init();
}
