//! VERTEX
//! INCLUDE _common.glsllib

void main_vs_postfx2() {
  gl_Position = vec4(a_position.xy, 0.0, 1.0);
  v_uv = a_position.xy * 0.5 + 0.5;
}

//! FRAGMENT
//! INCLUDE _common.glsllib
//! INCLUDE rand.glsllib

void main_fs_postfx2() {
  vec2 uv = v_uv;
  // random crap
  vec3 color = texture2D(u_texture_0, uv).gbr;

  gl_FragColor = vec4(color, 1.0);
}
