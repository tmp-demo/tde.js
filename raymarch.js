
function updateRaymarch() {
  var mat = mat4.create();
  var m2 = mat4.create();
  
  var position = [D.clipTime/100.0,15.0,15.0];

  mat4.rotate(m2, mat, D.currentTime/100000.0, [0,0,1])
  updateTimeUniforms();
  gl.uniformMatrix4fv(gl.getUniformLocation(D.currentProgram[0], 'mvmat'), false, m2);
  gl.uniform3fv(gl.getUniformLocation(D.currentProgram[0], 'position'),
                new Float32Array(position));
}