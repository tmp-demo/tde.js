function updateRaymarchBase(program, position, rotation, rotationAxis) {
  var mat = mat4.create();
  var m2 = mat4.create();
  mat4.rotate(m2, mat, rotation, rotationAxis)
  updateTimeUniforms(program);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'mvmat'), false, m2);
  gl.uniform3fv(gl.getUniformLocation(program, 'position'),
                new Float32Array(position));
}

function updateRaymarchStatic(program, position, rotation, rotationAxis) {
    updateTimes();
    updateRaymarchBase(program, position, 0, [0,0,0]);
}


function updateRaymarch(program) {
  updateTimes();
  updateRaymarchBase(program,
                    [D.clipTime/100.0,15.0,15.0],
                    D.currentTime/100000.0,
                    [0,0,0]);
}


function updateRaymarchTranslate(program, p1, p2) {
  updateTimes();
  var dt = D.clipTime/D.scenes[D.currentScene].duration;
  updateRaymarchBase(program, [p1[0]*(1-dt) + p2[0]*dt,
                               p1[1]*(1-dt) + p2[1]*dt,
                               p1[2]*(1-dt) + p2[2]*dt]
                     , 0, [0,0,0]);
}

