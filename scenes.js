D.scenes.pushScene = function(scene) {
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
{text: "DemoJS'13",
start:6000,
end:10000,
classname:"",
top:300,
left:300,
instance : null}
];


function loadScenes() {
  // intro
  D.scenes.pushScene( {
    duration: 5323,
    fragments: ["city_intro"],
    vertex: "quad",
    update: [function(prog) {
      updateRaymarchStatic(prog, [0, 15.0, 15.0]);
    }]
  });

  // sad
  D.scenes.pushScene( {
    duration: THIRTYTWOBARS,
    fragments: ["city_1"],
    vertex: "quad",
    update: [function(prog) {
      updateRaymarchTranslate(prog, [0, 15.0, 15.0],[20, 10.0, 15.0]);
    }]
  });

  // rainbow!
  D.scenes.pushScene( {
    duration: THIRTYTWOBARS,
    fragments: ["city_rainbow"],
    vertex: "quad",
    update: [function(prog) {
      updateRaymarchTranslate(prog, [20, 10.0, 15.0],[20, 20.0, -120.0]);
    }]
  });
/*
  D.scenes.pushScene( {
    duration: THIRTYTWOBARS,
    fragments: ["gay-ring"],
    vertex: "quad",
    update: [updateDefault]
  });
*/
  // traveling right with chroma
  D.scenes.pushScene( {
    duration: THIRTYTWOBARS,
    fragments: ["city_2", "chroma"],
    vertex: "quad",
    update: [function(prog) {
      updateRaymarchTranslate(prog, [20, 15.0, 15.0],[100, 15.0, 15.0]);
    }, updateDefault]
  });
  
  D.scenes.pushScene( {
    duration: THIRTYTWOBARS*2,
    fragments: ["city_2", "gay-flag"],
    vertex: "quad",
    update: [function(prog) {
      updateRaymarchTransition(prog, [100, 15.0, 15.0],[100, 15.0, 15.0],
                                      0, [0,1,0], 1, [0,1,0]);
    }, updateDefault]
  });

  D.scenes.pushScene( {
    duration: THIRTYTWOBARS,
    fragments: ["gay-ring2"],
    vertex: "quad",
    update: [updateDefault]
  });
  
    D.scenes.pushScene( {
    duration: THIRTYTWOBARS,
    fragments: ["gay-ring3"],
    vertex: "quad",
    update: [updateDefault]
  });

  D.scenes.pushScene( {
    duration: THIRTYTWOBARS,
    fragments: ["city_2", "blur"],
    vertex: "quad",
    update: [function(prog) {
      updateRaymarchTransition(prog, [100, 15.0, 15.0],[100, 15.0, 15.0],
                                      0, [0,1,0], 1, [0,1,0]);
    }, updateDefault]
  });

  D.scenes.pushScene( {
    duration: THIRTYTWOBARS,
    fragments: ["city_2"],
    vertex: "quad",
    update: [function(prog) {
      updateRaymarchTransition(prog, [135, 20.0, 15.0],[135, 20.0, 60.0],
                                      1.57079633, [-1,0,0], 1.57079633, [-1,0,0]);
    }, updateDefault]
  });
  //D.scenes.pushScene( {
    //duration: THIRTYTWOBARS,
    //fragments: ["city_2", "gay-ring"],
    //vertex: "quad",
    //update: [function(prog) {
      //updateRaymarchTransition(prog, [135, 20.0, 60.0],[135, 20.0, 105.0],
                                      //1.57079633, [-1,0,0], 1.57079633, [-1,0,0]);
    //}, updateDefault]
  //});

  D.scenes.pushScene( {
    duration: THIRTYTWOBARS,
    fragments: ["city_fancy"],
    vertex: "quad",
    update: [function(prog) {
      updateRaymarchStatic(prog, [300, 15.0, 1000.0]);
    }]
  });

  // rainbow!
  D.scenes.pushScene( {
    duration: THIRTYTWOBARS,
    fragments: ["city_rainbow"],
    vertex: "quad",
    update: [function(prog) {
      updateRaymarchTranslate(prog, [20, 10.0, 15.0],[20, 20.0, -120.0]);
    }]
  });

  // traveling right with chroma
  D.scenes.pushScene( {
    duration: THIRTYTWOBARS,
    fragments: ["city_2", "chroma"],
    vertex: "quad",
    update: [function(prog) {
      updateRaymarchTranslate(prog, [100, 15.0, 15.0],[100, 15.0, 115.0]);
    }, updateDefault]
  });


  assertScenesSorted();
  var lastScene = D.scenes[D.scenes.length - 1];
  seeker.max = D.endTime = lastScene.start + lastScene.duration;
}
