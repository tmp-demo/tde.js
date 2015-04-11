//! VERTEX
//! INCLUDE _common.glsllib

void main_vs_explode() {
    vec3 pos = a_position + a_normal * (sin(a_uv.y * 10.0 + u_global_time) * 6.0 + 8.0);
  gl_Position = u_view_proj_mat * vec4(pos + vec3(25.0, 0.0, 0.0) * u_object_id, 1.0);
  v_position = pos;
}

//! FRAGMENT
//! INCLUDE _common.glsllib

void main_fs_explode() {
  vec3 pos = v_position * 0.2;
  float checker = mod(floor(pos.x) + floor(pos.y) + floor(pos.z), 2.0);
  gl_FragColor = vec4(vec3(checker, 1.0, exp(-fract(u_global_time))), 1.0);
}
