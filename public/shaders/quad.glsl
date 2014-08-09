//! VERTEX

void main_vs_quad() {
  gl_Position = vec4(text_params.xy + position.xy * text_params.zw, 0.0, 1.0);
  v_tex_coords = position.xy * 0.5 + 0.5;
}

//! FRAGMENT

void main_fs_quad() {
  gl_FragColor = texture2D(texture_0, v_tex_coords) * mask;
}
