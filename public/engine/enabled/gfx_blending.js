
function prepare_blending(pass) {
  gl.disable(gl.BLEND);
  if (pass.blend) {
    gl.enable(gl.BLEND);
    gl.blendFunc.apply(gl, pass.blend);
  }
}

