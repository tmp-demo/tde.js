
function prepare_depth_test(pass) {
  if (pass.depth_test) {
    gl.enable(gl.DEPTH_TEST);
  } else {
    gl.disable(gl.DEPTH_TEST);
  }
}
