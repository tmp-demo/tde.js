
function text_init() {
  canvas_2d = document.createElement("canvas");
  canvas_2d.width = canvas_2d.height = 2048;
  ctx_2d = canvas_2d.getContext("2d");
  minify_context(ctx_2d);
}

function clear_texture_canvas() {
  ctx_2d.clearRect(0, 0, 2048, 2048);
}

function texture_fill_rect(x, y, w, h, style) {
  var sz = 2048;
  ctx_2d.fillStyle = style;
  ctx_2d.fillRect(x*sz, y*sz, w*sz, h*sz);
}

function create_text_texture(fontSize, text) {
  clear_texture_canvas();
  
  fontSize *= 100;
  ctx_2d.font = fontSize + "px Calibri";

  var width = 3 + ctx_2d.measureText(text).width|0,
    height = fontSize * 1.50;
  
  ctx_2d.fillStyle = "#fff";
  ctx_2d.fillText(text, 2, fontSize);
  
  return create_texture(
    width, height, gl.RGBA,
    ctx_2d.getImageData(0, 0, width, height).data,
    false, true
  );
}

