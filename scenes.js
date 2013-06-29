D.scenes.pushScene = function(scene) {
  var lastScene = D.scenes.length == 0 ? {start:0, duration :0} : D.scenes[D.scenes.length -1];
  scene.start = lastScene.start+lastScene.duration;
  D.scenes.push(scene);
}

function loadScenes() {
  D.scenes.pushScene( {
    duration: 15000,
    fragments: ["marcher1"],
    vertex: "quad",
    update: [updateRaymarch]
  });

  D.scenes.pushScene( {
    duration: 5000,
    fragments: ["green-red", "blur"],
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
