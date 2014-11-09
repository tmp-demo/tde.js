
function clear_texture_canvas() {
  textureContext.clearRect(0, 0, 2048, 2048);
}

function create_text_texture(fontSize, text) {
  clear_texture_canvas();
  
  fontSize *= 100;
  textureContext.font = fontSize + "px Calibri";

  var width = 3 + textureContext.measureText(text).width|0,
    height = fontSize * 1.50;
  
  textureContext.fillStyle = "#fff";
  textureContext.fillText(text, 2, fontSize);
  
  return [create_texture(width, height, gl.RGBA, textureContext.getImageData(0, 0, width, height).data, false, true), width / height];
}
