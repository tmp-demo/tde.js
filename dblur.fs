precision lowp float;
uniform vec2  direction;
uniform sampler2D texture_0;
varying vec2 v_tex_coords;

#define radius 10.0

void main() {
  vec2 p = v_tex_coords - direction * radius / 2.0;
  vec4 c = vec4(0.0, 0.0, 0.0, 0.0);
  for (int i = 0; i < int(radius); ++i) {
  	c = c + texture2D(texture_0, p + float(i) * direction);
  }
  gl_FragColor = c / radius;
}
