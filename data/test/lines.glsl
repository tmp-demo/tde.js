//! VERTEX
//! INCLUDE _common.glsllib
//! INCLUDE rand.glsllib

vec3 line_pos(float d, float side, float line_id, float t) {
    vec3 pos = vec3(0.0);

    float line_length = 3.0;

    float td = t+(d*line_length);

    pos.x = sin(td*0.1) * 30.0 + sin(td*0.01) * 40.0;
    pos.y = sin(td*0.4) * 50.0 + cos(td*0.2) * 10.0;
    pos.z = sin(td*0.6) * 40.0 + cos(td*0.5) * 25.0;

    pos.x += sin(line_id*0.4 + td * 3.0) * (55.0 * sin(line_id)) * abs(sin(td*0.5));
    pos.y += sin(line_id*0.4 + td * 3.0) * (55.0 * sin(line_id)) * abs(sin(td*0.6));
    pos.z += cos(line_id*0.4 + td * 3.0) * (55.0 * sin(line_id)) * abs(sin(td*0.5));

    return pos;
}

void main_vs_lines() {
  // retrieve the information packed in a_position
  float side    = a_position.x;
  float d       = a_position.y;
  float line_id = a_position.z;

  float aspect = u_resolution.x / u_resolution.y;

  float thickness = 0.015;

  // compute the position on the path and d and d+epsion
  vec4 p1 = u_view_proj_mat * vec4(line_pos(d, side, line_id, u_global_time), 1.0);
  vec4 p2 = u_view_proj_mat * vec4(line_pos(d + 0.001, side, line_id, u_global_time), 1.0);

  // compute the direction vector in screen space
  vec2 s1 = p1.xy/p1.w;
  vec2 s2 = p2.xy/p2.w;
  s1.x *= aspect;
  s2.x *= aspect;
  vec2 dir = normalize(s2 - s1);

  // compute the normal
  vec2 n = vec2(-dir.y, dir.x);
  n.x /= aspect;
  n *= side * p1.w;

  // apply thickness
  n *= thickness;

  gl_Position = p1 + vec4(n, 0.0, 0.0);

  // add some colors to help visualizing the effect
  v_color = mix(
    vec3(0.1, 0.4, 0.8),
    vec3(1.1, 0.3, 0.1),
    d
  );
} 

//! FRAGMENT
//! INCLUDE _common.glsllib

void main_fs_lines() {
  gl_FragColor = vec4(v_color, 1.0);
}
