function animate(keyframes, time)
{
  var last = keyframes.length - 1;
  if (time <= keyframes[0][0]) return keyframes[0][1];
  if (time >= keyframes[last][0]) return keyframes[last][1];
  
  // we must have at least 2 keyframes, or it will crash
  var i = 0;
  while ((i < last) && (keyframes[i][0] < time)) i++;
  var k1 = keyframes[i - 1];
  var k2 = keyframes[i];
  var t = (time - k1[0]) / (k2[0] - k1[0]);
  return k1[1].map(function(v, i)
  {
    return (1 - t) * v + t * k2[1][i];
  })
}
