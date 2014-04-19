precision lowp float;
uniform sampler2D texture_0;
varying vec2 v_tex_coords;

void main() {
  gl_FragColor = texture2D(texture_0, v_tex_coords);
}
