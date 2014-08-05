//! VERTEX

void main_vs_buildings_mtl() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = position.xy * 0.5 + 0.5;
}

//! FRAGMENT
//! INCLUDE rand.glsllib

vec4 black() { return vec4(0.0, 0.0, 0.0, 1.0); }

float rectangle(vec2 uv, float x1, float y1, float x2, float y2) {
  if (
    uv.x > x1 && uv.x < x2 &&
    uv.y > y1 && uv.y < y2
  ) {
    return 1.0;
  }
  return 0.0;
}

void main_fs_buildings_mtl() {
  vec2 uv = v_tex_coords;
  gl_FragColor = vec4(uv.y, 0.9, 0.7, 1.0);

  float window = rectangle(uv, 0.4, 0.35, 0.6, 0.50);
  float roof = rectangle(uv, 0.0, 0.8, 1.0, 1.0);
  float wall = (1.0 - window - roof);

  float wall_shade = uv.y * 0.3 + 0.6;

  gl_FragColor = window * black()
               + roof * vec4(0.2, 0.2, 0.4, 1.0) * sin(uv.x*1000.0)
               + wall * vec4(wall_shade, wall_shade*0.9, wall_shade*0.7, 1.0);
}
