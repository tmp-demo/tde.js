//! VERTEX

void main_vs_select4() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = (vec2(1.0, 1.0) + position.xy) / 2.0;
}

//! FRAGMENT

void main_fs_select4() {
  float v = 1.0 - v_tex_coords.y;
  vec4 a = texture2D(texture_0, v_tex_coords);
  vec4 b = texture2D(texture_1, v_tex_coords);
  vec4 c = texture2D(texture_2, v_tex_coords);
  vec4 d = texture2D(texture_3, v_tex_coords);
  if (v < 0.25) {
    gl_FragData[0] = a;
  } else if (v < 0.50) {
    gl_FragData[0] = mix(a,b, 4.0*(v - 0.25));
  } else if (v < 0.75) {
    gl_FragData[0] = mix(b,c, 4.0*(v - 0.50));
  } else {
    gl_FragData[0] = mix(c,d, 4.0*(v - 0.75));
  }
}
