//! VERTEX
//! INCLUDE _common.glsllib
//! INCLUDE rand.glsllib

void main_vs_blur_h() {
  gl_Position = vec4(a_position.xy, 0.0, 1.0);
  v_uv = a_position.xy * 0.5 + 0.5;
}

//! FRAGMENT
//! INCLUDE _common.glsllib
//! INCLUDE blur.glsllib

void main_fs_blur_h() {
  gl_FragColor = directional_blur(u_texture_0, v_uv, vec2(1.0/u_resolution.x, 0.0));
}