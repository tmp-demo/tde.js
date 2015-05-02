//! VERTEX
//! INCLUDE _common.glsllib

void main_vs_show_depth() {
  gl_Position = vec4(a_position, 1.0);
  v_uv = a_position.xy * 0.5 + 0.5;
}

//! FRAGMENT
//! INCLUDE _common.glsllib

void main_fs_show_depth() {
    gl_FragColor = vec4(vec3(texture2D(u_texture_0, v_uv).r), 1.0);
}
