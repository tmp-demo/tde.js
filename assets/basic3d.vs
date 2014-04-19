attribute vec3 position;
attribute vec3 normals;
attribute vec2 tex_coords;
uniform mat4 mv_mat;

varying vec2 v_tex_coords;
varying vec3 v_normals;

void main() {
  gl_Position = mv_mat * vec4(position, 1.0);
  v_normals = normals; //(mv_mat * vec4(normals, 1.0)).xyz;
  v_tex_coords = tex_coords;
}
