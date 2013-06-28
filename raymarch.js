
function renderRayMarch() {
  var mat = mat4.create();
  var m2 = mat4.create();
  var axis = vec3.create();
  vec3.set(axis,0,0,1);
  mat4.rotate(m2, mat, D.currentTime/1000.0, axis)
  gl.useProgram(D.currentProgram);
  updateCurrentTime();
  gl.uniformMatrix4fv(gl.getUniformLocation(D.currentProgram, 'mvmat'), false, m2);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.disableVertexAttribArray(0);
}