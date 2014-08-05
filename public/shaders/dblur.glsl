//! VERTEX

void main_vs_dblur() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = (vec2(1.0, 1.0) + position.xy) / 2.0;
}

//! FRAGMENT
const float NB_BLUR_TAPS = 10.0;

void main_fs_dblur() {
  vec2 p = v_tex_coords - step * NB_BLUR_TAPS / 2.0;
  vec4 c = vec4(0.0, 0.0, 0.0, 0.0);
  for (int i = 0; i < int(NB_BLUR_TAPS); ++i) {
  	c = c + texture2D(texture_0, p + float(i) * step) / NB_BLUR_TAPS;
        //smoothstep(0.0, NB_BLUR_TAPS/2.0, float(i)) *
        //smoothstep(NB_BLUR_TAPS/2.0, NB_BLUR_TAPS, float(i)) / (NB_BLUR_TAPS / 5.0);
  }
  gl_FragColor = c;
}
