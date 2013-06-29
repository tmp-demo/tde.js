D.scenes.pushScene = function(scene) {
  var lastScene = D.scenes.length == 0 ? {start:0, duration :0} : D.scenes[D.scenes.length -1];
  scene.start = lastScene.start+lastScene.duration;
  D.scenes.push(scene);
}

function loadScenes() {
  D.scenes.pushScene( {
    duration: 15000,
    fragments: ["city_1"],
    vertex: "quad",
    update: [updateRaymarch, updateDefault]
  });

  D.scenes.pushScene( {
    duration: 15000,
    fragments: ["city_2", "chroma"],
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
