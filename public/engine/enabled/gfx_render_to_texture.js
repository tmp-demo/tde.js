
function init_render_to_texture(sequence) {
  // replace the render passes' texture arrays by actual frame buffer objects
  // this is far from optimal...

  for (var p=0; p<sequence.length; ++p) {
    var pass = sequence[p];
    if (pass.render_to) {
      pass.fbo = frame_buffer(pass.render_to);
    }
  }
}

function frame_buffer(target) {
  var fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

  if (target.color && textures[target.color]) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures[target.color].tex, 0);
  if (target.depth && textures[target.depth]) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, textures[target.depth].tex, 0);

  // #debug{{
  var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status != gl.FRAMEBUFFER_COMPLETE) {
    console.error(frame_buffer_error(status), "Incomplete framebuffer");
  }
  // #debug}}

  return fbo;
}

function prepare_render_to_texture(pass) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, pass.fbo);

  var rx = canvas.width;
  var ry = canvas.height;
  if (pass.render_to) {
    rx = textures[pass.render_to.color].width;
    ry = textures[pass.render_to.color].height;
  }

  uniforms["u_resolution"] = [rx,ry];
  return [rx,ry];
}

function cleanup_render_to_texture(pass) {
    // nothing to do
}
