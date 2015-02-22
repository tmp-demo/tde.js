
function text_init() {
  canvas_2d = document.createElement("canvas");
  canvas_2d.width = canvas_2d.height = 2048;
  ctx_2d = canvas_2d.getContext("2d");
  minify_context(ctx_2d);
  ctx_2d.textAlign = "center";
  ctx_2d.fillStyle = "#fff";
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

  var measure = ctx_2d.measureText(text);
  var width = 3 + measure.width|0,
    height = fontSize * 1.5;
	
  ctx_2d.fillText(text, width / 2, fontSize);
  
  return create_texture(
    width, height, gl.RGBA,
    ctx_2d.getImageData(0, 0, width, height).data,
    false, true
  );
}

function create_vertical_text_texture(fontSize, text) {
  clear_texture_canvas();
  
  fontSize *= 100;
  ctx_2d.font = fontSize + "px Calibri";

  var width = fontSize,
    height = fontSize;
	
  for (var i = 0; i < text.length; ++i) {
	ctx_2d.fillText(text[i], width / 2, height);
	height += fontSize * 0.7;
  }
  
  height += fontSize * 0.3;
  
  return create_texture(
    width, height, gl.RGBA,
    ctx_2d.getImageData(0, 0, width, height).data,
    false, true
  );
}