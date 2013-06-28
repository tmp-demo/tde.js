D.scenes.pushScene = function(scene) {
  var lastScene = D.scenes.length == 0 ? {start:0, duration :0} : D.scenes[D.scenes.length -1];
  scene.start = lastScene.start+lastScene.duration;
  D.scenes.push(scene);
}

function loadScenes() {
  D.scenes.pushScene( {
    duration: 15000,
    fragment: "marcher1",
    vertex: "quad",
    render: renderRayMarch
  });

  D.scenes.pushScene( {
    duration: 5000,
    fragment: "green-red",
    vertex: "quad",
    render: renderDefault
  });

  D.scenes.pushScene( {
   duration: 15000,
   fragment: "bw",
   vertex: "quad",
   render: renderDefault
  });


  assertScenesSorted();
  var lastScene = D.scenes[D.scenes.length - 1];
  seeker.max = D.endTime = lastScene.start + lastScene.duration;
}
