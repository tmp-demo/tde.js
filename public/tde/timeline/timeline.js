var sequence = {
  "u_global_time": [
      { start:0, duration:64, animation:"[t]" }
  ],
  "u_cam_pos": [
    {
      start: 0,
      duration: 32,
      animation: [
        [0, [5, 200, -5]],
        [16, [-5, 50, -7]],
        [32, [5, 20, -5]],
      ],
    },
    {
      start: 32,
      duration: 32,
      animation: [
        [0, [5, 20, -5]],
        [32, [5, 200, -5]],
      ],
    },
  ],
  "glitch": [
    {
      start: 0,
      duration: 64,
      animation: [
        [0, [0]],
        [64, [1]],
      ],
    },
  ],
}

var dom_tracks = {};

function add_track(track_name) {
    var dom_track = document.createElement("div");
    dom_track.className = "track";
    dom_track.name = track_name;

    var dom_track_info = document.createElement("div");
    dom_track_info.className = "track-info";
    dom_track_info.innerHTML = track_name;

    var dom_track_content = document.createElement("div");
    dom_track_content.className = "track-content";

    dom_track.appendChild(dom_track_info);
    dom_track.appendChild(dom_track_content);
    document.querySelector("#timeline-content").appendChild(dom_track);

    return dom_track;
}

function add_clip(track_name, clip_index) {
    var clip = sequence[track_name][clip_index];
    var dom_clip = document.createElement("div");
    dom_clip.className = "clip";
    dom_clip.model = clip;

    var dom_track = dom_tracks[track_name]
    for (var elt in dom_track.children) {
        var child = dom_track.children[elt];
        if (child.className == "track-content") {
            child.appendChild(dom_clip);
            break;
        }
    }

    return dom_clip
}

function init_editor_timeline() {
    for (var t in sequence) {
        var track = sequence[t];
        dom_tracks[t] = add_track(t);
        for (var c in track) {
            var clip = track[c];
            clip.dom = add_clip(t, c);
        }
    }

    timline_update_dom_clips();

    document.querySelector("#xscrollbar").addEventListener("input", timline_update_dom_clips);
    document.querySelector("#xzoombar").addEventListener("input", timline_update_dom_clips);
}

function clear_editor_timeline() {
  dom_tracks = {}
  var dom_track_container = document.querySelector("#timeline-content");
  dom_track_container.innerHTML = '';
}

function timline_update_dom_clips() {
    var scroll_bar = document.querySelector("#xscrollbar");
    var x_scroll = -parseFloat(scroll_bar.value);

    var zoom_bar = document.querySelector("#xzoombar");
    var x_scale = parseFloat(zoom_bar.value);

    document.querySelectorAll(".clip").forEach(function(elt) {
        var t = "translateX("+ (elt.model.start+x_scroll)*x_scale +"px)";
        elt.style.transform = t;
        elt.style.width = ""+(elt.model.duration*x_scale)+"px";
    })
}
