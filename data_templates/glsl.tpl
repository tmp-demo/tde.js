//! VERTEX

void main_vs_NAME() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}

//! FRAGMENT

void main_fs_NAME() {
  gl_FragData[0] = vec4(1.0, 1.0, 0.0, 1.0);
}
