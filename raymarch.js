
function renderRayMarch() {
  var mat = mat4.create();
  var m2 = mat4.create();
  
  var position = [D.clipTime/100.0,15.0,15.0];

  mat4.rotate(m2, mat, D.currentTime/100000.0, [0,0,1])
  gl.useProgram(D.currentProgram);
  updateTimeUniforms();
  gl.uniformMatrix4fv(gl.getUniformLocation(D.currentProgram, 'mvmat'), false, m2);
  gl.uniform3fv(gl.getUniformLocation(D.currentProgram, 'position'),
                new Float32Array(position));
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  gl.disableVertexAttribArray(0);
}