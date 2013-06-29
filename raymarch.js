function m2q(m) {
  qm = {w:0.0, x:0.0, y:0.0, z:0.0};
  qm.w= Math.sqrt(1 + m[0][0] + m[1][1] + m[2][2]) / 2;
  qm.x = (m[2][1] - m[1][2]) / (4 *qm.w);
  qm.y = (m[0][2] - m[2][0]) / (4 *qm.w);
  qm.z = (m[1][0] - m[0][1]) / (4 *qm.w);
  return qm;
}

function updateRaymarchBase(program, position, rotation, rotationAxis) {
  var mat = mat4.create();
  var m2 = mat4.create();
  mat4.rotate(m2, mat, rotation, rotationAxis)
  updateTimeUniforms(program);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'mvmat'), false, m2);
  gl.uniform3fv(gl.getUniformLocation(program, 'position'),
                new Float32Array(position));
}

function updateRaymarchBase2(program, position, rotationMat) {
  updateTimeUniforms(program);
  gl.uniformMatrix4fv(gl.getUniformLocation(program, 'mvmat'), false, rotationMat);
  gl.uniform3fv(gl.getUniformLocation(program, 'position'),
                new Float32Array(position));
}

function updateRaymarchTransition(program, p1, p2, r1, a1, r2, a2) {
  updateTimes();
  var dt = D.clipTime/D.scenes[D.currentScene].duration;

  var m1 = mat4.create();
  mat4.rotate(m1, m1, r1, a1);
  var m2 = mat4.create();
  mat4.rotate(m2, m2, r2, a2);

  var mm1 = mat3.create();
  mat3.fromMat4(mm1, m1);
  var mm2 = mat3.create();
  mat3.fromMat4(mm2, m2);

  var q1 = quat.create();
  quat.fromMat3(q1, mm1);
  var q2 = quat.create();
  quat.fromMat3(q2, mm2);

  var q = quat.create();

  quat.lerp(q, q1, q2, dt);

  var rotMat = mat4.create()
  mat4.fromQuat(rotMat, q);

  updateRaymarchBase2(program, [p1[0]*(1-dt) + p2[0]*dt,
                                p1[1]*(1-dt) + p2[1]*dt,
                                p1[2]*(1-dt) + p2[2]*dt]
                     , rotMat);
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

