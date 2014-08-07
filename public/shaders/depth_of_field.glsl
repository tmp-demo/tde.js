//! VERTEX

void main_vs_depth_of_field() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = (vec2(1.0, 1.0) + position.xy) / 2.0;
}

//! FRAGMENT

float sample_depth(vec2 uv) {
  return texture2D(texture_4, v_tex_coords + uv).r;
}

void main_fs_depth_of_field() {
  float rx = 1.0 /resolution.x;
  float ry = 1.0 /resolution.y;
  float main_sample = sample_depth(vec2(0.0, 0.0));
  float depth_r  = sample_depth(vec2(rx,  0.0));
  float depth_l  = sample_depth(vec2(-rx, 0.0));
  float depth_t  = sample_depth(vec2(0.0,  ry));
  float depth_b  = sample_depth(vec2(0.0, -ry));
  float depth_tr = sample_depth(vec2(rx,   ry));
  float depth_br = sample_depth(vec2(rx,  -ry));
  float depth_tl = sample_depth(vec2(-rx,  ry));
  float depth_bl = sample_depth(vec2(-rx, -ry));

  float samples = main_sample
                + depth_r
                + depth_l
                + depth_t
                + depth_b
                + depth_tr
                + depth_br
                + depth_tl
                + depth_bl;

  samples = max(samples / 9.0, main_sample);
  float v = max((samples - near) / (far-near), 0.0);

  v = v*v;
  if (v > focus) {
    v = (v  - focus) / (1.0 - focus);
  } else {
    v = (focus - v - 0.2) / max(focus, 0.0000001);
  }
  vec4 a = texture2D(texture_0, v_tex_coords);
  vec4 b = texture2D(texture_1, v_tex_coords);
  vec4 c = texture2D(texture_2, v_tex_coords);
  vec4 d = texture2D(texture_3, v_tex_coords);

  float sobel_x =  depth_tl + 2.0*depth_l + depth_bl - depth_tr - 2.0 * depth_r - depth_br;
  float sobel_y = -depth_tl - 2.0*depth_t - depth_tr + depth_bl + 2.0 * depth_b + depth_br;
  float sob = 1.0 - 10.0 * sqrt((sobel_x*sobel_x) + (sobel_y*sobel_y));

//  gl_FragColor = vec4(v, v, v, 1.0);
//
//  a = vec4(0.2,0.2,0.2, 1.0);
//  b = vec4(0.4,0.4,0.4, 1.0);
//  c = vec4(0.6,0.6,0.6, 1.0);
//  d = vec4(0.8,0.8,0.8, 1.0);
//
//  a = vec4(1.0,0.0,0.0, 1.0);
//  b = vec4(0.0,1.0,0.0, 1.0);
//  c = vec4(0.0,0.0,1.0, 1.0);
//  d = vec4(0.5,0.5,0.5, 1.0);

  // smoothstep(a, b, x) has undefined behavior if a > b
  float da = 1.0 - smoothstep(0.4, 0.6, v);// +  smoothstep(0.999999999999, 1.0, v);
  float db = smoothstep(0.4, 0.6, v) * (1.0 - smoothstep(0.7, 0.8, v));
  float dc = smoothstep(0.7, 0.8, v) * (1.0 - smoothstep(0.9, 1.0, v));
  float dd = smoothstep(0.9, 0.99, v); // * (1.0 - smoothstep(0.99999999999, 1.0, v));

  gl_FragColor = a * da + b * db + c * dc + d * dd;
  gl_FragColor = a;// * da + b * db + c * dc + d * dd;
  gl_FragColor *= sob;
  //gl_FragColor = vec4(main_sample, main_sample, main_sample, 1.0);

  gl_FragColor.a = 1.0;
}
