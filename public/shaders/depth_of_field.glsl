//! VERTEX

void main_vs_depth_of_field() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = (vec2(1.0, 1.0) + position.xy) / 2.0;
}

//! FRAGMENT

void main_fs_depth_of_field() {
  float v = max((texture2D(texture_4, v_tex_coords).r - near) / (far-near), 0.0);
  v = v*v;
  if (v > focus) {
    v = (v  - focus) / (1.0 - focus);
  } else {
    v = (focus - v) / max(focus, 0.0000001);
  }
  vec4 a = texture2D(texture_0, v_tex_coords);
  vec4 b = texture2D(texture_1, v_tex_coords);
  vec4 c = texture2D(texture_2, v_tex_coords);
  vec4 d = texture2D(texture_3, v_tex_coords);

//  gl_FragColor = vec4(v, v, v, 1.0);
//  return;

//  a = vec4(0.2,0.2,0.2, 1.0);
//  b = vec4(0.4,0.4,0.4, 1.0);
//  c = vec4(0.6,0.6,0.6, 1.0);
//  d = vec4(0.8,0.8,0.8, 1.0);

//  a = vec4(1.0,0.0,0.0, 1.0);
//  b = vec4(0.0,1.0,0.0, 1.0);
//  c = vec4(0.0,0.0,1.0, 1.0);
//  d = vec4(0.5,0.5,0.5, 1.0);

  float da = smoothstep(0.5, 0.4, v);
  float db = smoothstep(0.4, 0.5, v) * smoothstep(0.8, 0.7, v);
  float dc = smoothstep(0.7, 0.8, v) * smoothstep(1.0, 0.9, v);
  float dd = smoothstep(0.9, 1.0, v);

  gl_FragColor = a * da + b * db + c * dc + d * dd;
  gl_FragColor.a = 1.0;
  //if (v < 0.50) {
  //  gl_FragColor = a;
  //  //gl_FragColor = vec4(0.2,0.2,0.2, 1.0);
  //} else if (v < 0.80) {
  //  gl_FragColor = mix(a,b, 4.0*(v - 0.25));
  //  //gl_FragColor = vec4(0.4,0.4,0.4, 1.0);
  //} else if (v < 0.92) {
  //  gl_FragColor = mix(b,c, 4.0*(v - 0.50));
  //  //gl_FragColor = vec4(0.6,0.6,0.6, 1.0);
  //} else {
  //  gl_FragColor = mix(c,d, 4.0*(v - 0.75));
  //  //gl_FragColor = vec4(0.8,0.8,0.8, 1.0);
  //}
}
