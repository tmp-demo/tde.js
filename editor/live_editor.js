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
      if (!rendering) {
        editor_build(current_plugin);
      }
    }
  });

  demo_canvas.style.border = "1px solid red";
}

function set_current_plugin(plugin) {
  if (current_plugin !== plugin) {
    if (current_plugin && current_plugin.destroy) {
      current_plugin.destro()
    }
    plugin.init();
    current_plugin = plugin;
  }
}

function init_editor(plugin) {
  init_ui($("#editor"), $("#renderer"));
  current_plugin = null;
  set_current_plugin(plugin);
}

function editor_build(plugin) {
  var err = false;

  marks.forEach(function (e) {
    e.clear();
  });

  rendering = true;

  try {
    plugin.execute(editor.getValue(), dest_asset);
  } catch(e) {
    err = true;
    var doc = editor.getDoc();
    var ln = e.lineNumber - 1;
    console.log(ln);
    console.log(e.message);
    marks.push(
      doc.markText(
        { line: ln, ch: 0 },
        { line: ln, ch: editor.getLine(ln).length },
        { className: "text-error", title: e.message }
      )
    );
  }
  plugin.render(dest_asset);
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
