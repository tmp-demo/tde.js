//! VERTEX

void main_vs_city() {
  gl_Position = view_proj_mat * vec4(position, 1.0);
  v_position = gl_Position.xyz;
  v_normals = normals;
  v_tex_coords = tex_coords;
  gl_Position.z = gl_Position.z / 10.0;
}

//! FRAGMENT

void main_fs_city() {
  float dp = dot(v_normals, light);
  gl_FragColor = vec4(dp, dp, dp, 1.0);
}
