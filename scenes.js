function add_scene(scene) {
  var lastScene = D.scenes.length == 0 ? {start:0, duration :0} : D.scenes[D.scenes.length -1];
  scene.start = lastScene.start+lastScene.duration;
  D.scenes.push(scene);
}

// duration of two
var THIRTYTWOBARS = 10647;

D.Texts = [
{text: "padenot",
start:2000,
end:5000,
classname:"",
top:200,
left:130,
instance : null},
{text: "Nical",
start:2200,
end:5200,
classname:"",
top:300,
left:500,
instance : null},
{text: "Gruck",
start:2400,
end:5400,
classname:"",
top:500,
left:300,
instance : null},
{text: "Evoke'13",
start:6000,
end:10000,
classname:"",
top:300,
left:300,
instance : null}
];

function gen_shaders() {
  var default_colors = "#define default_color vec3(1.0,1.0,1.0)\n" +
                       "#define shadowColor vec3(0.0,0.3,0.7)\n" +
                       "#define skyColor vec3(0.9,1.0,1.0) \n";

  var default_max = "#define MAX_STEPS 200\n" +
                    "#define MAX_DISTANCE 600.0\n";

  D.shaders["city_1"] = build_shader_src(
    resource("marcher_base.fs"),
    {
      "$define_colors": [default_colors],
      "$define_max": [default_max],
      "$scene": [resource("default_scene.fs")],
      "$camera": [resource("fisheye_camera.fs")],
      "$shading": [
        "debug_steps(num_steps, color);"
      ]
    }
  );

  //dump(D.shaders["city_1"].src);
}

function load_scenes() {

  add_scene({
    duration: THIRTYTWOBARS,
    fragments: ["city_1"],
    vertex: "quad",
    update: [function(prog) {
      updateRaymarchTranslate(prog, [0, 15.0, 15.0],[20, 10.0, 15.0]);
    }]
  });

  assertScenesSorted();
  var lastScene = D.scenes[D.scenes.length - 1];
  seeker.max = D.endTime = lastScene.start + lastScene.duration;
}
