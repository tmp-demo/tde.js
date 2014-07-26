//! VERTEX

void main_vs_printtext() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = position.xy;
}

//! FRAGMENT

void main_fs_printtext() {
  vec2 uv = v_tex_coords / text_params.xy + vec2(text_params.z, cos(v_tex_coords.x * text_params.w * 4.0) * text_params.w);
  uv = uv * 0.5 + 0.5;
  gl_FragColor = vec4(texture2D(texture_0, uv).rgb, 1.0);
}
