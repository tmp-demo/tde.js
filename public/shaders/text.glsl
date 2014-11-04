//! VERTEX
//! INCLUDE _common.glsllib

void main_vs_text() {
  gl_Position = vec4(text_params.xy + position.xy * vec2(text_params.w * resolution.y / resolution.x, -1.0) * text_params.z, 0.0, 1.0);
  v_tex_coords = position.xy * 0.5 + 0.5;
}

//! FRAGMENT
//! INCLUDE _common.glsllib

void main_fs_text() {
  gl_FragColor = texture2D(texture_0, v_tex_coords) * mask;
}
