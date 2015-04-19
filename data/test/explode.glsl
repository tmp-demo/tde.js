//! VERTEX
//! INCLUDE _common.glsllib

void main_vs_explode() {
  vec3 pos = a_position + a_normal *
             (sin(a_uv.y * 10.0 + u_global_time*0.05) *
             abs(sin(a_triangle_id))* 40.0);
  gl_Position = u_view_proj_mat *
                vec4(pos + vec3(25.0, 0.0, 0.0) * u_object_id, 1.0);
  v_position = pos;
}

//! FRAGMENT
//! INCLUDE _common.glsllib

void main_fs_explode() {
  vec3 pos = v_position * 0.2;
  float a = sin(u_global_time / 32.0);
 
  gl_FragColor = mix(
    vec4(0.1, 0.4, 0.8, 1.0),
    vec4(0.2, 0.9, 0.3, 1.0),
    a
  );
}
