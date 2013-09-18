
base_uniforms = "precision lowp float;"+
                "uniform float time;"+
                "uniform float duration;"+
                "uniform float beat;"+
                "uniform vec2  resolution;";

basic2_fs = base_uniforms +
            "uniform sampler2D texture_0;"+
            "void main() {"+
            "    vec4 sample = texture2D(texture_0, gl_FragCoord.xy);"+
            "    float f = time/duration;"+
            "    gl_FragColor = vec4(sample.r,f,f,1.0);"+
            "}";

function prepare() {
  // here goes the code that declares the resources to load
  load_text("quad.vs", function(data) { vs_quad_src = data; } );
  load_text("red.fs", function(data) { fs_red_src = data; } );
  load_text("chroma.fs", function(data) { fs_chroma_src = data; } );
}

function demo_init() {
  console.log("demo_init");

  VS = gl.VERTEX_SHADER;
  FS = gl.FRAGMENT_SHADER;

  vs_basic = compile_shader(vs_quad_src, VS);
  fs_intro1 = compile_shader(fs_red_src, FS);
  fs_intro2 = compile_shader(basic2_fs, FS);
  fs_blur = compile_shader(fs_chroma_src, FS);

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
