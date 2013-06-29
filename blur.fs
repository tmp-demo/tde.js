precision lowp float;
/* relative to scene start time */
uniform float time;
/* scene duration */
uniform float duration;
/* resolution */
uniform vec2 res;
uniform float beat;

uniform sampler2D u_image;
uniform vec2 u_textureSize;
varying vec2 v_texCoord;

vec2 fisheye(vec2 coord, float amt) {
  vec2 cc = coord - 0.5;
  float dist = dot(cc, cc);
  return coord + cc * dist * amt;
}

void main(void)
{
  float amount = (1.0 + beat) * (1.0 + beat);

  vec2 pos = gl_FragCoord.xy;

  float x = pos.x;
  float y = pos.y;
  vec2 fc = pos;
  vec2 center = res / 2.0;
  float distcenter = abs(length(fc - center));
  float maxdist = length(res) / 2.0;
  float darken = 1.0;
  if (mod(y, 6.0) <= 1.0) {
    darken = 0.8;
  }

  darken = darken * (1.0 - distcenter / maxdist) + 0.1;

  gl_FragColor = texture2D(u_image, fisheye(v_texCoord * 0.7 + 0.15, amount)) * darken;
}
