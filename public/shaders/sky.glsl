//! VERTEX

void main_vs_sky() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = position.xy * vec2(resolution.x / resolution.y, 1.0);
}

//! FRAGMENT
//! INCLUDE scattering.glsllib

void main_fs_sky() {
  vec3 dir = normalize((view_proj_mat_inv * vec4(v_tex_coords, 1.0, 1.0)).xyz);
  gl_FragColor = vec4(skyColor(dir) + sun(dir), 1.0);
}
