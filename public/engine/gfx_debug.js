
// #debug{{

var _uniforms = [
  "cam_pos",
  "world_mat",
  "view_proj_mat",
  "view_proj_mat_inv",
  "resolution",
  "focus",
  "light",
  /*"texture_0",
  "texture_1",
  "texture_2",
  "texture_3",
  "texture_4",*/
  "clip_time",
  "text_params",
  "mask",
  "cam_target",
  "cam_fov",
  "glitch"
];

var _enums = _enums = { }; // #debug

function gl_error() {
  var v = gl.getError();
  var name = _enums[v];
  return (name !== undefined) ? ("gl." + name) :
      ("/*UNKNOWN WebGL ENUM*/ 0x" + v.toString(16) + "");
}

function frame_buffer_error(e) {
  if (e == gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT) {
      return "FRAMEBUFFER_INCOMPLETE_ATTACHMENT";}
  if (e == gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT) {
      return "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";}
  if (e == gl.FRAMEBUFFER_INCOMPLETE_DRAW_BUFFER) {
      return "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";}
  if (e == gl.FRAMEBUFFER_UNSUPPORTED) {
      return "FRAMEBUFFER_UNSUPPORTED";}
  if (e == gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE) {
      return "FRAMEBUFFER_INCOMPLETE_MULTISAMPLE";}
  return "unknown framebuffer error";
}

// #debug}}

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

  var vs_placeholder = "" +
    "precision lowp float;" +
    "uniform mat4 view_proj_mat;" +
    "attribute vec3 a_position;" +
    "varying vec3 v_position;" +
    "" +
    "void main()" +
    "{" +
      "gl_Position = view_proj_mat * vec4(a_position, 1.0);" +
      "v_position = a_position;" +
    "}" +
    "";
  var fs_placeholder = "" +
    "precision lowp float;" +
    "varying vec3 v_position;" +
    "" +
    "void main()" +
    "{" +
      "vec3 pos = v_position * 0.1;" +
      "gl_FragColor = vec4(" +
        "mod(floor(pos.x), 2.0) * 0.4 + 0.3," +
        "mod(floor(pos.y), 2.0) * 0.3 + 0.3," +
        "mod(floor(pos.z), 2.0) * 0.5 + 0.3," +
        "1.0" +
      ");" +
    "}" +
  "";

  placeholder_program = load_program_from_source(vs_placeholder, fs_placeholder);
}
