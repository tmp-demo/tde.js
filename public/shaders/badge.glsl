//! VERTEX
//! INCLUDE _common.glsllib

void main_vs_badge() {
  float c = cos(text_params.w), s = sin(text_params.w);
  mat2 rot = mat2(c, -s, s, c);
  gl_Position = vec4(text_params.xy + rot * position.xy * vec2(resolution.y / resolution.x, -1.0) * text_params.z, 0.0, 1.0);
  v_tex_coords = position.xy * 0.5 + 0.5;
}

//! FRAGMENT
//! INCLUDE _common.glsllib

void main_fs_badge() {
  gl_FragColor = texture2D(texture_0, v_tex_coords) * mask;
}
