
function preapre_clear(pass) {
  if (pass.clear) {
    gl.clearColor(pass.clear[0], pass.clear[1], pass.clear[2], pass.clear[3]);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
}
