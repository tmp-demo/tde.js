attribute vec3 position;
attribute vec2 tex_coords;

varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(position, 1.0);
  v_texCoord = tex_coords;
}
