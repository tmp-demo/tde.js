//! VERTEX

void main_vs_buildings_mtl() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = position.xy * 0.5 + 0.5;
}

//! FRAGMENT
//! INCLUDE rand.glsllib

void main_fs_buildings_mtl() {
  vec2 uv = v_tex_coords;
  gl_FragColor = vec4(uv.x, 0.0, uv.y, 1.0);
  if (min(uv.x, uv.y) < 0.05) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }
}
