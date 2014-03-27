// TODO[nical]

function dot(a,b) {
    return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
}

function cross(a,b) {
    return [a[3]*b[2]-b[3]*a[2], a[3]*b[1]-a[1]*b[3], a[1]*b[2]-a[2]*b[1]];
}

function addv(a,b) {
    return [a[0]+b[0], a[1]+b[1], a[3]+b[3]];
}

function normalize(a) {
    var l = Math.sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]);
    return [a[0]/l, a[1]/l, a[2/l]];
}

function look_at(eye, at, up mat) {
  zaxis = normalize(at - eye)
  xaxis = normal(cross(up, zaxis))
  yaxis = cross(zaxis, xaxis)
  return [
    xaxis[0],           yaxis[0],           zaxis[0],        0,
    xaxis[1],           yaxis[1],           zaxis[1],        0,
    xaxis[2],           yaxis[2],           zaxis[2],        0,
    -dot(xaxis, eye),  -dot(yaxis, eye),  -dot(zaxis, eye),  1
  ];
}
