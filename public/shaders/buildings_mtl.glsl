//! VERTEX

void main_vs_buildings_mtl() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
  v_tex_coords = position.xy * 0.5 + 0.5;
}

//! FRAGMENT
//! INCLUDE rand.glsllib

float rectangle(vec2 uv, float x1, float y1, float x2, float y2) {
  if (
    uv.x > x1 && uv.x < x2 &&
    uv.y > y1 && uv.y < y2
  ) {
    return 1.0;
  }
  return 0.0;
}

//                   1.0
//   +-----------------+ 1.0
//   |     roof        |
//   +-----------------+ 0.8
//   |      +-+        |
//   |      | |  wall  |
//   |      +-+        |
//   +--------+--------+ 0.2
//   | street |  grass |
// 0 +--------+--------+ 0.0
//   0.0     0.5
//
void main_fs_buildings_mtl() {
  vec2 uv = v_tex_coords;

  float window    = rectangle(uv, 0.4, 0.35, 0.6, 0.50);
  float wall      = rectangle(uv, 0.0, 0.2,  1.0, 0.8) - window;
  float roof      = rectangle(uv, 0.0, 0.8,  1.0, 1.0);
  float street    = rectangle(uv, 0.0, 0.0,  0.5, 0.1);
  float side_walk = rectangle(uv, 0.0, 0.1,  1.0, 0.2);
  float grass     = rectangle(uv, 0.5, 0.0,  1.0, 0.1);

  float wall_shade = uv.y * 0.3 + 0.6;

  vec3 color = window    * vec3(0.0, 0.0, 0.0)
             + wall      * vec3(wall_shade, wall_shade*0.9, wall_shade*0.7)
             + roof      * vec3(0.2, 0.2, 0.4) * sin(uv.x*1000.0)
             + grass     * vec3(0.0, 0.6, 0.1)
             + street    * vec3(0.3, 0.3, 0.3)
             + side_walk * vec3(0.5, 0.5, 0.5);

  gl_FragColor = vec4(color, 1.0);
}
