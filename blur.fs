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
  float amount = beat * 5.0;
  gl_FragColor = texture2D(u_image, fisheye(v_texCoord * 0.7 + 0.15, amount));
}
