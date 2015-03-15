
function init_placeholders() {
  geometry_placeholder = {
    buffers: [
      make_vbo(POS, [
        -100, 0, -100,
        -100, 0, 100,
        100, 0, 100,
        100, 0, 100,
        100, 0, -100,
        -100, 0, -100
      ]),
      make_vbo(NORMAL, [
        0, 1, 0,
        1, 1, 0,
        0, 1, 0,
        0, 0, 0,
        0, 1, 0,
        0, 1, 1
      ]),
      make_vbo(UV, [
        0, 0,
        0, 1,
        1, 1,
        1, 1,
        1, 0,
        0, 0
      ])
    ],
    mode: gl.TRIANGLES,
    vertex_count: 6
  }

  var vs_placeholder = "\
    precision lowp float; \
    uniform mat4 view_proj_mat; \
    attribute vec3 a_position; \
    varying vec3 v_position; \
     \
    void main() \
    { \
      gl_Position = view_proj_mat * vec4(a_position, 1.0); \
      v_position = a_position; \
    } \
    ";
  var fs_placeholder = "\
    precision lowp float; \
    varying vec3 v_position; \
     \
    void main() \
    { \
      vec3 pos = v_position * 0.1; \
      gl_FragColor = vec4( \
        mod(floor(pos.x), 2.0) * 0.4 + 0.3, \
        mod(floor(pos.y), 2.0) * 0.3 + 0.3, \
        mod(floor(pos.z), 2.0) * 0.5 + 0.3, \
        1.0 \
      ); \
    } \
  ";

  placeholder_program = load_program_from_source(vs_placeholder, fs_placeholder);
}

function get_geometry(geometry_name) {
  var geometry = geometries[geometry_name];

  if (!geometry) {
    console.log("Missing geometry "+obj.geometry+" (using placeholder)");
    geometry = geometry_placeholder
  }

  return geometry;
}

function get_shader_program(pass) {
  var shader_program = programs[pass.program]

  if (!shader_program) {
    if (pass.program) {
      console.log("Missing program "+pass.program+" (using placeholder)");
    }
    shader_program = placeholder_program;
  }

  return shader_program;
}
