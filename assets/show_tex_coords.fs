precision lowp float;
varying vec2 v_tex_coords;

void main() {
  gl_FragColor = vec4(v_tex_coords, 0.0, 1.0);
}
