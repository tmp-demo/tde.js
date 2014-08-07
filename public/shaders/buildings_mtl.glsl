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

float ellipsis(vec2 uv, float x, float y, float dx, float dy) {
  if ( (uv.x -x)* (uv.x -x) / (dx*dx) + (uv.y - y) * (uv.y - y) / (dy*dy)  < 1.0) {
    return 1.0;
  }
  return 0.0;
}

float balcony_pattern(vec2 uv) {
  uv = mod(uv, 0.02);

  return ellipsis(uv, 0.01, 0.01, 0.01, 0.01) * (1.0 - ellipsis(uv, 0.01, 0.01, 0.005, 0.005));

  //if ((uv.x -x) * (uv.x -x) + (uv.y - y) * (uv.y - y)  < sqrt(x2-x1)) {
  //  return 1.0;
  //}
  //return 0.0;
}

//                   1.0
//   +-----------------+ 1.0
//   |     roof        |
//   +-----------------+ 0.8
//   |      +-+        |
//   |      | |  wall  |
//   |      +-+        |
//   +-----------------+ 0.5
//   |      +-+        |
//   |      | |  wall  |
//   |------+-+--------|
//   +--------+--------+ 0.2
//   | street |  grass |
// 0 +--------+--------+ 0.0
//   0.0     0.5
//
void main_fs_buildings_mtl() {
  vec2 uv = v_tex_coords;

  float win_x  = 0.30;
  float win_frame = 0.02;
  float win1_y = 0.36;
  float win2_y = 0.52;
  float win_h1 = 0.1;
  float win_h2 = 0.15;
  float rebord_h = 0.02;

  float balcony   = rectangle(uv, 0.0, 0.5, 1.0, 0.55)
                  * balcony_pattern(uv);

                  // floor 1
  float window    = rectangle(uv, win_x,           win1_y,  0.5 - win_frame, win1_y + win_h1)
                  + rectangle(uv, 0.5 + win_frame, win1_y, (1.0 - win_x),    win1_y + win_h1)
                  // floor 2
                  + rectangle(uv, win_x,           win2_y,  0.5 - win_frame, win2_y + win_h2)
                  + rectangle(uv, 0.5 + win_frame, win2_y, (1.0 - win_x),    win2_y + win_h2)
                  // ground
                  + rectangle(uv, 0.15, 0.13, 0.4, 0.25)
                  + rectangle(uv, 0.45, 0.13, 0.8, 0.20);
  window *= (1.0 - balcony);


  float window_b  = rectangle(uv, win_x - win_frame, win1_y - rebord_h, 1.0 - win_x + win_frame, win1_y)
                  + ellipsis(uv, 0.5, win1_y + win_h1, 0.22, 0.02) * rectangle(uv, 0.0, win1_y+win_h1, 1.0, 0.5);

  float door      = rectangle(uv, 0.03, 0.1,  0.13, 0.25)
                  + rectangle(uv, 0.85, 0.1,  0.95, 0.25)
                  + rectangle(uv, 0.45, 0.21,  0.80, 0.25);

  float wall      = rectangle(uv, 0.0, 0.1,  1.0, 0.9) - window - window_b - balcony - door;


  float roof      = rectangle(uv, 0.0, 0.9,  1.0, 1.0);
  float street    = rectangle(uv, 0.0, 0.0,  0.5, 0.05);
  float side_walk = rectangle(uv, 0.0, 0.05, 1.0, 0.1);
  float grass     = rectangle(uv, 0.5, 0.0,  1.0, 0.05);

  float wall_shade = 1.0 - (mod(uv.y - 0.1, 0.2) * 0.4);

  vec3 color = window    * vec3(0.0, 0.0, 0.0)
             + wall      * vec3(wall_shade, wall_shade*0.9, wall_shade*0.7)
             + roof      * vec3(0.2, 0.2, 0.4) * sin(uv.x*1000.0)
             + grass     * vec3(0.0, 0.6, 0.1)
             + street    * vec3(0.3, 0.3, 0.3)
             + side_walk * vec3(0.5, 0.5, 0.5)
             + window_b  * vec3(0.6, 0.5, 0.4)
             + balcony   * vec3(0.2, 0.2, 0.2)
             + door      * vec3(0.5, 0.1, 0.1);
  color *= (1.0 - balcony);

  float sum = window
            + wall
            + roof
            + grass
            + street
            + side_walk
            + window_b
            + balcony;
  sum *= 0.5;

  gl_FragColor = vec4(color, window + balcony);
}
