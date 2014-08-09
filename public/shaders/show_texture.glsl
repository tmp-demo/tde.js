//! VERTEX

void main_vs_show_texture() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = position.xy * 0.5 + 0.5;
}

//! FRAGMENT

void main_fs_show_texture() {
  gl_FragColor = vec4(vec3(texture2D(texture_0, v_tex_coords).rgb), 1.0);
}
