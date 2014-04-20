precision lowp float;
uniform vec2 step;
uniform sampler2D texture_0;
varying vec2 v_tex_coords;

#define NB_TAPS 10.0

void main() {
  vec2 p = v_tex_coords - step * NB_TAPS / 2.0;
  vec4 c = vec4(0.0, 0.0, 0.0, 0.0);
  for (int i = 0; i < int(NB_TAPS); ++i) {
  	c = c + texture2D(texture_0, p + float(i) * step);
  }
  gl_FragColor = c / NB_TAPS;
}
