//! VERTEX

void main_vs_dblur() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = (vec2(1.0, 1.0) + position.xy) / 2.0;
}

//! FRAGMENT

void main_fs_dblur() {
  vec2 p = v_tex_coords - step * NB_BLUR_TAPS / 2.0;
  vec4 c = vec4(0.0, 0.0, 0.0, 0.0);
  for (int i = 0; i < int(NB_BLUR_TAPS); ++i) {
  	c = c + texture2D(texture_0, p + float(i) * step);
  }
  gl_FragData[0] = c / NB_BLUR_TAPS;
}
