// Here goes all the code related to editing the demo.
// this should not be included in the final demo.

function $(s) {
  return document.querySelector(s);
}

function $$(s) {
  return document.querySelectorAll(s);
}

scenesShortcuts = {"97":0, "122":1,"101":2, "114":3,"116":4,"116":5,"121":6,"117":7,"105":8,"111":9};
scenesLoopShortcuts = {"113":0, "115":1,"100":2, "102":3,"103":4,"104":5,"106":6,"107":7,"108":8,"109":9};

function editor_init() {
  console.log("edition_init");
    seeker = document.getElementById("seeker");
    seeker.addEventListener("input", function (e) {
      seek(e.target.value);
      seeker.value = e.target.value;
      demo.looping = false;
    });

    // var canvas_tag = document.getElementById("renderer");
    // canvas_tag.parentNode.removeChild(canvas_tag);
    // document.querySelector(".wrapper").appendChild(canvas_tag);

    var split = document.URL.split('?');
    for (var i=0; i<split.length; ++i) {
      var item = split[i];
      if (item.indexOf("scene=") >= 0) {
        var scene = parseInt(item.slice(6), 10);
        console.log("skipt to scene " + scene);
        seek(demo.scenes[scene].start_time);
      }
      if (item.indexOf("looping") >= 0) {
        demo.looping = true;
      }
    }

    var timeline_canvas = document.getElementById("timeline");
    var timeline = timeline_canvas.getContext("2d");
    timeline_canvas.width = timeline_canvas.clientWidth;
    timeline_canvas.height = timeline_canvas.clientHeight;
    timeline.fillStyle = "rgba(255, 255, 255, 0.0)";
    timeline.fillRect(0, 0, timeline_canvas.width, timeline_canvas.height);

    timeline.translate(0.5,0.5);
    timeline.lineWidth = 1;

    var time_sum = 0;
    var times = [0];
    for (var s=0;s<demo.scenes.length;++s) {
        time_sum += demo.scenes[s].duration;
        times = times.concat([time_sum]);
        console.log("scene at "+ time_sum);
    }

    timeline.strokeStyle = "rgb(160,160,160)";

    for (var t=0; t<times.length; ++t) {
      var factor = timeline_canvas.width / time_sum;
      var v = Math.floor(times[t] * factor);
      console.log("line at "+v);
      timeline.moveTo(v, 0);
      timeline.lineTo(v, timeline_canvas.height);
      timeline.stroke();
    }
    timeline.strokeStyle = "rgb(100,100,100)";
    timeline.moveTo(0,0);
    timeline.lineTo(timeline_canvas.width,0);
    timeline.stroke();


    document.addEventListener("keypress", function(e) {
      // play/pause
      if (e.charCode == 32) {
        console.log("space bar pressed");
        if (demo.playState == demo.PLAYING) {
          demo.playState = demo.PAUSED;
          //drumsTrack.stop(0);
          //otherTrack.stop(0);
        } else if(demo.playState == demo.ENDED) {
          seek(0);
        } else {
          demo.playState = demo.PLAYING;
          seek(demo.currentTime);
          mainloop();
        }
      } else if(e.charCode == 8) { //backspace key
        console.log("backspace pressed");
        demo.looping = false;
      } else if(typeof scenesShortcuts[e.charCode]  !== 'undefined' ) {
        console.log("jump to scene "+scenesShortcuts[e.charCode]);
        // jump to scene
        if (scenesShortcuts[""+e.charCode] < demo.scenes.length){//s >= 0 && s <= 9 && s < demo.scenes.length) {
          demo.looping = false;
          seek(demo.scenes[scenesShortcuts[""+e.charCode]].start_time);
        }
      } else if (typeof scenesLoopShortcuts[e.charCode]  !== 'undefined' ) {
        // jump to scene
        if (scenesLoopShortcuts[""+e.charCode] < demo.scenes.length){//s >= 0 && s <= 9 && s < demo.scenes.length) {
          demo.looping = true;
          demo.current_scene = scenesLoopShortcuts[""+e.charCode];
          seek(demo.scenes[demo.current_scene].start_time);
        }
      }
    });
}

// ---------------------------------------------------------------------

function dump(something) {
  var pre = document.createElement("pre");
  pre.innerHTML = something;
  document.body.appendChild(pre); 
}


// ---------------------------------------------------------------------

var frames = [];

function recordFrame(cvs) {
  cvs.toBlob(function(blob) {
    frames.push(blob);
  });
}

function stichFramesForDownload()
{
  var blob = new Blob(frames,  {type: "application/octet-binary"});
  var url = URL.createObjectURL(blob);
  location.href = url;
}

