var _loader_resource_count = 0;
var _loader_all_loaded = null;

function loader_init(on_load) {
  if (_loader_resource_count==0) {
    console.log("nothing to load");
    on_load();
  } else {
    _loader_all_loaded = on_load;
  }
}

function load_resource(src, cb) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", src);
  xhr.onload = function() {
    console.log("loaded: " + src);
    cb(xhr);
  };
  xhr.onerror = function() {
    alert("load_resource error "+src);
  }
  _loader_resource_count++
  xhr.send(null);
}

function resource_loaded() {
  --_loader_resource_count;
  if(_loader_resource_count == 0) {
    _loader_all_loaded();
  }
}

function load_audio(url, cb) {
  load_resource(url, function(xhr) {
    audio.context.decodeAudioData(xhr.response, function(data) {
      cb(data);
      resource_loaded();
    })
  });
}

function load_text(url, cb) {
  load_resource(url, function(xhr) {
    cb(xhr.responseText);
    resource_loaded();
  });
}