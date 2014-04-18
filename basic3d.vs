attribute vec3 position;
attribute vec2 tex_coords;
uniform mat4 mv_mat;

varying vec2 v_texCoord;

void main() {
  gl_Position = mv_mat * vec4(position, 1.0);
  v_texCoord = tex_coords;
}
