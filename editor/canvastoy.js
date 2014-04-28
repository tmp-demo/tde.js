function $(e) {
  return document.querySelector(e);
}

/*install*/
function init_editor_install() {
  var manifest_url = location.href + '/manifest.webapp';

  function install(e) {
    e.preventDefault();
    var installLocFind = navigator.mozApps.install(manifest_url);
    installLocFind.onsuccess = function(data) {
      // App is installed, do something
    };
    installLocFind.onerror = function() {
      // App wasn't installed, info is in
      // installapp.error.name
      alert(installLocFind.error.name);
    };
  };

  var button = $("#install-btn");

  var installCheck = navigator.mozApps.checkInstalled(manifest_url);

  installCheck.onsuccess = function() {
    if(installCheck.result) {
      button.style.display = "none";
    } else {
      button.addEventListener('click', install, false);
    };
  };

  function updateReady() {
    if (navigator.onLine) {
      var rv = confirm("You're online, and a new version is available, update?");
      if (rv) {
        document.location.reload(true);
      }
    }
  }

  window.applicationCache.addEventListener("updateready", updateReady);

  if(window.applicationCache.status === window.applicationCache.UPDATEREADY) {
    updateReady();
  }
}


function addSavedEntryToList(versions, key) {
  var opt = document.createElement('option');
  keys.push(key);
  opt.innerHTML = key;
  versions.appendChild(opt);
}

function populate() {
  var versions = document.getElementById("versions");
  versions.disabled = true;
  asyncStorage.length(function(len) {
    if (len == 0) {
      return;
    }

    function addOne(i)  {
      asyncStorage.key(i, function(key) {
        addSavedEntryToList(versions, key);

        if (i++ < len - 1) {
          addOne(i);
        } else {
          versions.disabled = false;
        }
      });
    }
    addOne(0);
  });

  versions.addEventListener("change", function() {
    asyncStorage.getItem(versions.options[versions.selectedIndex].value,
                         function(value) {
                           editor.setValue(value);
                         });
  });
}

function clearclear() {
  asyncStorage.clear();
}


function init_editor_storage() {

  /* gaia: shared/js/async_storage.js */
  asyncStorage = (function() {
    var DBNAME = 'asyncStorage';
    var DBVERSION = 1;
    var STORENAME = 'keyvaluepairs';
    var db = null;

    function withStore(type, f) {
      if (db) {
        f(db.transaction(STORENAME, type).objectStore(STORENAME));
      } else {
        var openreq = indexedDB.open(DBNAME, DBVERSION);
        openreq.onerror = function withStoreOnError() {
          console.error("asyncStorage: can't open database:", openreq.error.name);
        };
        openreq.onupgradeneeded = function withStoreOnUpgradeNeeded() {
          // First time setup: create an empty object store
          openreq.result.createObjectStore(STORENAME);
        };
        openreq.onsuccess = function withStoreOnSuccess() {
          db = openreq.result;
          f(db.transaction(STORENAME, type).objectStore(STORENAME));
        };
      }
    }

    function getItem(key, callback) {
      withStore('readonly', function getItemBody(store) {
        var req = store.get(key);
        req.onsuccess = function getItemOnSuccess() {
          var value = req.result;
          if (value === undefined)
            value = null;
          callback(value);
        };
        req.onerror = function getItemOnError() {
          console.error('Error in asyncStorage.getItem(): ', req.error.name);
        };
      });
    }

    function setItem(key, value, callback) {
      withStore('readwrite', function setItemBody(store) {
        var req = store.put(value, key);
        if (callback) {
          req.onsuccess = function setItemOnSuccess() {
            callback();
          };
        }
        req.onerror = function setItemOnError() {
          console.error('Error in asyncStorage.setItem(): ', req.error.name);
      };
    });
  }

  function removeItem(key, callback) {
    withStore('readwrite', function removeItemBody(store) {
      var req = store.delete(key);
      if (callback) {
        req.onsuccess = function removeItemOnSuccess() {
          callback();
        };
      }
      req.onerror = function removeItemOnError() {
        console.error('Error in asyncStorage.removeItem(): ', req.error.name);
      };
    });
  }

  function clear(callback) {
    withStore('readwrite', function clearBody(store) {
      var req = store.clear();
      if (callback) {
        req.onsuccess = function clearOnSuccess() {
          callback();
        };
      }
      req.onerror = function clearOnError() {
        console.error('Error in asyncStorage.clear(): ', req.error.name);
      };
    });
  }

  function length(callback) {
    withStore('readonly', function lengthBody(store) {
      var req = store.count();
      req.onsuccess = function lengthOnSuccess() {
        callback(req.result);
      };
      req.onerror = function lengthOnError() {
        console.error('Error in asyncStorage.length(): ', req.error.name);
      };
    });
  }

  function key(n, callback) {
    if (n < 0) {
      callback(null);
      return;
    }

    withStore('readonly', function keyBody(store) {
      var advanced = false;
      var req = store.openCursor();
      req.onsuccess = function keyOnSuccess() {
        var cursor = req.result;
        if (!cursor) {
          // this means there weren't enough keys
          callback(null);
          return;
        }
        if (n === 0) {
          // We have the first key, return it if that's what they wanted
          callback(cursor.key);
        } else {
          if (!advanced) {
            // Otherwise, ask the cursor to skip ahead n records
            advanced = true;
            cursor.advance(n);
          } else {
            // When we get here, we've got the nth key.
            callback(cursor.key);
          }
        }
      };
      req.onerror = function keyOnError() {
        console.error('Error in asyncStorage.key(): ', req.error.name);
      };
    });
  }

  return {
    getItem: getItem,
    setItem: setItem,
    removeItem: removeItem,
    clear: clear,
    length: length,
    key: key
  };
}());
}

function init_editor_with_callbacks(setup_cb, execute_cb, render_cb) {
fsbutton = $("#fullscreen");
ed = $("#editor");
keys = [];
marks = [];
rendering = false;
ctx = setup_cb();

editor = CodeMirror.fromTextArea(ed, {
  mode: "text/javascript",
  matchBrackets: true,
  autoCloseBrackets: true,
  lineNumbers: true,
  theme: "monokai"
});

var demo_render = $("#renderer");
demo_render.style.border = "1px solid red";

fsbutton.addEventListener("click", function(e) {
  var wrapper = $("#wrapper");
  if (!document.mozFullScreen && !document.webkitFullScreen) {
    var rfs = wrapper.requestFullScreen ||
      wrapper.mozRequestFullScreen ||
      wrapper.webkitRequestFullScreen;
    rfs.bind(wrapper)();
    //        resizeCanvas();
  } else {
    var cfs = document.cancelFullScreen ||
      document.mozCancelFullScreen ||
      document.webkitCancelFullScreen;
    cfs.bind(document)();
  }
});

document.addEventListener("keypress", function(e) {
  if (e.ctrlKey && (e.keyCode == 13 || e.keyCode == 10)) {
    if (!rendering) {
      render();
    }
  }
});
function render() {
  var err = false;

  marks.forEach(function (e) {
    e.clear();
  });
  //    resizeCanvas();

  rendering = true;


  var datestr = new Date().toUTCString(Date.now());

  asyncStorage.setItem(datestr, editor.getValue(), function() {
    addSavedEntryToList(versions, datestr);

    try {
      execute_cb(editor.getValue(), ctx);
    } catch(e) {
      err = true;
      var doc = editor.getDoc();
      var ln = e.lineNumber - 1;
      console.log(ln);
      console.log(e.message);
      marks.push(doc.markText({ line: ln, ch: 0 },
                              { line: ln, ch: editor.getLine(ln).length },
                              { className: "text-error", title: e.message })
                );
    }
    render_cb(ctx);
    rendering = false;
    textarea = editor.getWrapperElement();
    if (err) {
      textarea.classList.add("error");
      setTimeout(function() {
        textarea.classList.remove("error");
      }, 500);
    } else {
      textarea.classList.add("ok");
      setTimeout(function() {
        textarea.classList.remove("ok");
      }, 500);
    }
  });

}
}

function init_editor_all(setup_cv, execute_cb, render_cb) {
init_editor_with_callbacks(setup_cv, execute_cb, render_cb)
  init_editor_install();
  init_editor_storage();
}
