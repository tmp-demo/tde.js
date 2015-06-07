function animate(keyframes, time)
{
  var last = keyframes.length - 1;
  if (time <= keyframes[0][0]) return keyframes[0][1];
  if (time >= keyframes[last][0]) return keyframes[last][1];
  
  // we must have at least 2 keyframes, or it will crash
  var prev = [], next = [];
  for (var i = 0; i < keyframes[1][1].length; i++) {
    prev.push(2 * keyframes[0][1][i] - keyframes[1][1][i]);
    next.push(2 * keyframes[last][1][i] - keyframes[last-1][1][i]);
  }

  keyframes.push([2 * keyframes[last][0] - keyframes[last-1][0], next]);
  keyframes.unshift([keyframes[0][0] - keyframes[1][0], prev]);
  
  var i = 1;
  while ((i <= last) && (keyframes[i][0] < time)) i++;
  
  var k0 = keyframes[i - 2];
  var k1 = keyframes[i - 1];
  var k2 = keyframes[i];
  var k3 = keyframes[i + 1];
  
  var t = (time - k1[0]) / (k2[0] - k1[0]);
  
  var h1 = 2 * t * t * t - 3 * t * t + 1;          // calculate basis function 1
  var h2 = -2 * t * t * t + 3 * t * t;              // calculate basis function 2
  var h3 = t * t * t - 2 * t * t + t;         // calculate basis function 3
  var h4 = t * t * t - t * t;
  
  var out = [];
  for (var i = 0; i < k1[1].length; i++) {
    var t1 = (k2[1][i] - k0[1][i]) / 4;
    var t2 = (k3[1][i] - k1[1][i]) / 4;
    out.push(h1 * k1[1][i] + h2 * k2[1][i] + h3 * t1 + h4 * t2);
  }
  return out;
}
