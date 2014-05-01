var live_editor = {};

function $(e) {
  return document.querySelector(e);
}

function init_ui(text_editor, demo_canvas) {
  keys = [];
  marks = [];
  rendering = false;

  editor = CodeMirror.fromTextArea(text_editor, {
    mode: "text/javascript",
    matchBrackets: true,
    autoCloseBrackets: true,
    lineNumbers: true,
    theme: "monokai"
  });

  document.addEventListener("keypress", function(e) {
    if (e.ctrlKey && (e.keyCode == 13 || e.keyCode == 10)) {
      editor_build();
    }
  });

  demo_canvas.style.border = "1px solid red";
}

function update_asset_list() {
  var asset_list=document.getElementById("AssetList");
  for (var name in textures) {
    var option = document.createElement("option");
    option.text = name;
    asset_list.add(option);
  }  
}

function select_asset() {
  var asset_list=document.getElementById("AssetList");
  var name = asset_list.options[asset_list.selectedIndex].text;
  console.log(name);
  console.log(textures[name]);
  live_editor.current_asset = textures[name];
}

function set_current_plugin(plugin) {
  if (live_editor.current_plugin !== plugin) {
    if (live_editor.current_plugin && live_editor.current_plugin.destroy) {
      live_editor.current_plugin.destro()
    }
    plugin.init();
    live_editor.current_plugin = plugin;
  }
}

function init_live_editor(plugin) {
  init_ui($("#editor"), $("#renderer"));
  current_plugin = null;
  set_current_plugin(plugin);
  update_asset_list();
}

function editor_build() {
  if (rendering) {
    return;
  }

  var plugin = live_editor.current_plugin;
  var err = false;

  marks.forEach(function (e) {
    e.clear();
  });

  rendering = true;

  var asset = live_editor.current_asset;
  var result;
  try {
    plugin.execute(editor.getValue(), asset);
  } catch(e) {
    err = true;
    var doc = editor.getDoc();
    var ln = e.lineNumber - 1;
    console.log(ln);
    console.log(e.message);
/*
    marks.push(
      doc.markText(
        { line: ln, ch: 0 },
        { line: ln, ch: editor.getLine(ln).length },
        { className: "text-error", title: e.message }
      )
    );
*/
  }

  plugin.render(asset);

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
}
