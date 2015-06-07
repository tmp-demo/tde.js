var img_textures_data = {};


function img_texture_init() {
  if (!config.IMG_TEXTURE_ENABLED)
    return;
  

}



function handle_img_texture_loaded(image, texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);


}


function create_img_texture(filename, callback) {

  
  var imgTexture = gl.createTexture();

  img_textures_data[filename] = {
    tex: imgTexture,
    width: 0,
    height: 0
  };


  var image = new Image();
  image.onload = function() { 
    //retrieve width and height of the texture
    img_textures_data[filename].width = image.width;
    img_textures_data[filename].height = image.height;

    handle_img_texture_loaded(image, imgTexture); 
    callback(); //cf enginedriver callback
  }

  image.src = filename;
  
  return img_textures_data[filename];//we return something where width and height have not been set yet as loading texture is asynchronous
}
