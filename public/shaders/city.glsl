//! VERTEX

void main_vs_city() {
  gl_Position = view_proj_mat * vec4(position, 1.0);
  v_position = position;
  v_normals = normals;
  v_tex_coords = tex_coords;
}

//! FRAGMENT
//! INCLUDE scattering.glsllib

void main_fs_city() {
  vec3 diffuse = dot(normalize(v_normals), light) * skyColor(v_normals);
  gl_FragColor = vec4(applyFog(v_normals, diffuse), 1.0);
}
