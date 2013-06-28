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

mat4 rotationMatrix(vec3 ax, float angle)
{
  vec3 axis = normalize(ax);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;
  return mat4(oc * axis.x * axis.x + c         , oc * axis.x * axis.y - axis.z * s, oc * axis.z * axis.x + axis.y * s, 0.0,
      oc * axis.x * axis.y + axis.z * s, oc * axis.y * axis.y + c , oc * axis.y * axis.z - axis.x * s        , 0.0,
      oc * axis.z * axis.x - axis.y * s, oc * axis.y * axis.z + axis.x * s, oc * axis.z * axis.z + c         , 0.0,
      0.0, 0.0, 0.0, 1.0);
}

void main() {
  float speed = 20000.0;
  vec4 pos = vec4(gl_FragCoord.x, gl_FragCoord.y, 0, 0);
  pos = pos * rotationMatrix(vec3(1, 1, 0), time / 1000.0);
  float x = pos.x;
  float y = pos.y;
  vec2 fc = vec2(pos.x, pos.y);
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
