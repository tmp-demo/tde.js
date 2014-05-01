function $(e) {
  return document.querySelector(e);
}

function init_ui() {
  ed = $("#editor");
  keys = [];
  marks = [];
  rendering = false;

  editor = CodeMirror.fromTextArea(ed, {
    mode: "text/javascript",
    matchBrackets: true,
    autoCloseBrackets: true,
    lineNumbers: true,
    theme: "monokai"
  });

  document.addEventListener("keypress", function(e) {
    if (e.ctrlKey && (e.keyCode == 13 || e.keyCode == 10)) {
      if (!rendering) {
        editor_build();
      }
    }
  });

  var demo_render = $("#renderer");
  demo_render.style.border = "1px solid red";
}

function init_editor_all(plugin) {
  init_ui();
  ctx = plugin.init();
}

function editor_build(plugin) {
  var err = false;

  marks.forEach(function (e) {
    e.clear();
  });

  rendering = true;

  try {
    plugin.execute(editor.getValue(), ctx);
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
  plugin.render(ctx);
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
