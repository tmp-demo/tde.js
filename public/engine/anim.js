function animate(p0, p1, p2,t)
{
  for (var i = 0; i < p0.length; i++) {
    p0[i] = (p0[i] - 2 * p1[i] + p2[i]) * t * t + 2 * (p1[i] - p0[i]) * t + p0[i];
  }
  return p0;
}
