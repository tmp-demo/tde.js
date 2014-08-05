//! VERTEX

void main_vs_printtext() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = ((position.xy + text_params.zw + 1.0) * 0.5 - text_params.xy) / text_params.zw;
}

//! FRAGMENT

void main_fs_printtext() {
  gl_FragColor = texture2D(texture_0, v_tex_coords) * mask;
}
