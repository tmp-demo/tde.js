precision lowp float;
/* relative to scene start time */
uniform float time;
/* scene duration */
uniform float duration;
/* beat */
uniform float beat;
/* resolution */
uniform vec2 res;

float hash(float n)
{
  return fract(sin(n)*43758.5453);
}


void main() {
  float speed = 20000.0;
  float x = gl_FragCoord.x;
  float y = gl_FragCoord.y;
  vec2 fc = vec2(gl_FragCoord.x, gl_FragCoord.y);
  float dist = length(fc - res);
  vec2 center = vec2(res.x / 2.0, res.y/2.0);
  float distcenter = abs(length(fc - center));
  float maxdist = length(res);
  float darken = 1.0;
  if (mod(y, 6.0) <= 2.0) {
    darken = 0.8;
  }
  darken = darken * (0.7 - distcenter / maxdist) * beat * 2.0;
  gl_FragColor = vec4(hash(x / res.x + time / (duration*speed)) * darken,
                      0.5 * darken,
                      //    hash(y / res.y + time / (duration*speed)) * darken,
                      hash(dist / maxdist + time / (duration*speed)) * darken,
                      1.0);
}
