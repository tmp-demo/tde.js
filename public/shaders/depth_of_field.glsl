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
  float rx = 1.5 /resolution.x;
  float ry = 1.5 /resolution.y;
  float samples = sample_depth(vec2(0.0, 0.0))
                + sample_depth(vec2(rx,  0.0))
                + sample_depth(vec2(-rx, 0.0))
                + sample_depth(vec2(0.0,  ry))
                + sample_depth(vec2(0.0, -ry))
                + sample_depth(vec2(rx,   ry))
                + sample_depth(vec2(rx,  -ry))
                + sample_depth(vec2(-rx,  ry))
                + sample_depth(vec2(-rx, -ry));
  samples = samples / 9.0;
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

  float da = smoothstep(0.6, 0.4, v);
  float db = smoothstep(0.4, 0.6, v) * smoothstep(0.8, 0.7, v);
  float dc = smoothstep(0.7, 0.8, v) * smoothstep(1.0, 0.9, v);
  float dd = smoothstep(0.9, 1.0, v);

  gl_FragColor = a * da + b * db + c * dc + d * dd;
  gl_FragColor.a = 1.0;
}
