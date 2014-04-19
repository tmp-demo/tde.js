attribute vec2 position;
varying vec2 v_tex_coords;

void main() {
  gl_Position = vec4(position, 0.0, 1.0);
  v_tex_coords = (vec2(1.0, 1.0) + position) / 2.0;
}
