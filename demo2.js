
base_uniforms = "precision lowp float;"+
                "uniform float time;"+
                "uniform float duration;"+
                "uniform float beat;"+
                "uniform vec2  resolution;";

quad_vs = "attribute vec2 position;"+
          "varying vec2 v_texCoord;"+
          "void main() {"+
          "  gl_Position = vec4(position, 0.0, 1.0);"+
          "  v_texCoord = (vec2(1.0, 1.0) + position) / 2.0;"+
          "}";

basic_fs =  base_uniforms +
            "void main() {"+
            "    gl_FragColor = vec4(1.0,0.0,0.0,1.0);"+
            "}";
basic2_fs = base_uniforms +
            "uniform sampler2D texture_0;"+
            "void main() {"+
            "    vec4 sample = texture2D(texture_0, gl_FragCoord.xy);"+
            "    float f = time/duration;"+
            "    gl_FragColor = vec4(sample.r,f,f,1.0);"+
            "}";

function prepare() {
  load_text("blur.fs", function(data) { fs_blur_src = data; } );
  load_text("chroma.fs", function(data) { fs_chroma_src = data; } );
  // here goes the code that declares the resources to load
}

function demo_init() {
  console.log("demo_init");

  VS = gl.VERTEX_SHADER;
  FS = gl.FRAGMENT_SHADER;

  vs_basic = compile_shader(quad_vs, VS);
  fs_intro1 = compile_shader(basic_fs, FS);
  fs_intro2 = compile_shader(basic2_fs, FS);
  fs_blur = compile_shader(fs_blur_src, FS);

  scene_1_1 = shader_program(vs_basic, fs_intro1);
  scene_1_2 = shader_program(vs_basic, fs_intro2);

  tex1 = create_texture();
  tex2 = create_texture();

  demo.scenes = [
    {
      name:"intro", //#opt
      // scene 1
      duration: 10000,
      update: null,
      passes: [
        {
          update: null,
          program: scene_1_1,
          render: draw_quad,
          outputs: [tex1],
        },
        {
          texture_inputs: [tex1],
          update: function() {},
          render: draw_quad,
          program: scene_1_2,
          // no outputs, means render to screen
        }
      ]
    },
  ];

}

demo = {
  scenes: null,
  current_scene: null,
  current_time: 0,
  start_time: 0,
  end_time: 0,
  PAUSED: 0,
  PLAYING: 1,
  ENDED: 2,
  play_state: 1,
  looping: false,
  recording: false,
};
