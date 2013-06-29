function updateRaymarch(program) {
  var mat = mat4.create();
  var m2 = mat4.create();

  var position = [D.clipTime/100.0,15.0,15.0];

  mat4.rotate(m2, mat, D.currentTime/100000.0, [0,0,0])
  updateTimeUniforms(program);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'mvmat'), false, m2);
  gl.uniform3fv(gl.getUniformLocation(program, 'position'),
                new Float32Array(position));
}
