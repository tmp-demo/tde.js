attribute vec3 position;
attribute vec3 normals;
attribute vec2 tex_coords;

uniform mat4 view_proj_mat;

varying vec2 v_tex_coords;
varying vec3 v_normals;
varying vec3 v_position;

void main() {
  gl_Position = view_proj_mat * vec4(position, 1.0);
  v_position = gl_Position.xyz;
  v_normals = normals;
  v_tex_coords = tex_coords;
}
