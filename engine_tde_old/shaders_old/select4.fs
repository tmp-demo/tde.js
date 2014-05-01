precision lowp float;
uniform vec2  resolution;
uniform sampler2D texture_0;
uniform sampler2D texture_1;
uniform sampler2D texture_2;
uniform sampler2D texture_3;
uniform sampler2D texture_4;
varying vec2 v_tex_coords;

void main() {
  float v = 1.0 - v_tex_coords.y;
  vec4 a = texture2D(texture_0, v_tex_coords);
  vec4 b = texture2D(texture_1, v_tex_coords);
  vec4 c = texture2D(texture_2, v_tex_coords);
  vec4 d = texture2D(texture_3, v_tex_coords);
  if (v < 0.25) {
    gl_FragColor = a;
  } else if (v < 0.50) {
    gl_FragColor = mix(a,b, 4.0*(v - 0.25));
  } else if (v < 0.75) {
    gl_FragColor = mix(b,c, 4.0*(v - 0.50));
  } else {
    gl_FragColor = mix(c,d, 4.0*(v - 0.75));
  }
}
