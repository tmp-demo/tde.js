function m2q(m) {
  qm = {w:0.0, x:0.0, y:0.0, z:0.0};

  qm.w= Math.sqrt(1 + m[0][0] + m[1][1] + m[2][2]) / 2;
  qm.x = (m[2][1] - m[1][2]) / (4 *qm.w);
  qm.y = (m[0][2] - m[2][0]) / (4 *qm.w);
  qm.z = (m[1][0] - m[0][1]) / (4 *qm.w);

  return qm;
}

