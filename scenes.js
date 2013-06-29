D.scenes.pushScene = function(scene) {
  var lastScene = D.scenes.length == 0 ? {start:0, duration :0} : D.scenes[D.scenes.length -1];
  scene.start = lastScene.start+lastScene.duration;
  D.scenes.push(scene);
}

D.Texts = [
{text: "plop",
start:4000,
end:8000,
classname:"",
top:5,
left:5,
instance : null},
{text: "plop2",
start:1200,
end:2400,
classname:"",
top:50,
left:50,
instance : null},
];


function loadScenes() {
  D.scenes.pushScene( {
    duration: 15000,
    fragments: ["marcher1", "blur"],
    vertex: "quad",
    update: [updateRaymarch, updateDefault]
  });

  D.scenes.pushScene( {
    duration: 10000,
    fragments: ["green-red", "gay-flag"],
    vertex: "quad",
    update: [updateDefault, updateDefault]
  });
  
  D.scenes.pushScene( {
    duration: 100000,
    fragments: ["gay-ring", "gay-ring"],
    vertex: "quad",
    update: [updateDefault, updateDefault]
  });

  D.scenes.pushScene( {
    duration: 5000,
    fragments: ["green-red"],
    vertex: "quad",
    update: [updateDefault]
  });


  D.scenes.pushScene( {
    duration: 5000,
    fragments: ["bw"],
    vertex: "quad",
    update: [updateDefault]
  });

  assertScenesSorted();
  var lastScene = D.scenes[D.scenes.length - 1];
  seeker.max = D.endTime = lastScene.start + lastScene.duration;
}
