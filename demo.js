
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
  demo.w = 800;
  demo.h = 600;
  // here goes the code that declares the resources to load
  load_text("quad.vs", function(data) { vs_quad_src = data; } );
  load_text("basic3d.vs", function(data) { vs_basic3d_src = data; } );
  load_text("red.fs", function(data) { fs_red_src = data; } );
  load_text("blue.fs", function(data) { fs_blue_src = data; } );
  load_text("chroma.fs", function(data) { fs_chroma_src = data; } );
  load_text("mrt_test_1.fs", function(data) { mrt_1_src = data; } );
  load_text("mrt_test_2.fs", function(data) { mrt_2_src = data; } );
}

function demo_init() {
  console.log("demo_init"); // #opt

  VS = gl.VERTEX_SHADER;
  FS = gl.FRAGMENT_SHADER;

  vs_basic = compile_shader(vs_quad_src, VS);
  vs_basic3d = compile_shader(vs_basic3d_src, VS);
  fs_intro1 = compile_shader(fs_red_src, FS);
  fs_blue = compile_shader(fs_blue_src, FS);
  fs_intro2 = compile_shader(basic2_fs, FS);
  fs_blur = compile_shader(fs_chroma_src, FS);
  mrt_fs_1 = compile_shader(mrt_1_src, FS);
  mrt_fs_2 = compile_shader(mrt_2_src, FS);

  cube_prog = shader_program(vs_basic3d, fs_intro1);
  scene_1_1 = shader_program(vs_basic, fs_intro1);
  scene_1_2 = shader_program(vs_basic, fs_intro2);
  scene_blue = shader_program(vs_basic, fs_blue);
  mrt_1 = shader_program(vs_basic, mrt_fs_1);
  mrt_2 = shader_program(vs_basic, mrt_fs_2);

  tex1 = create_texture();
  tex2 = create_texture();

  demo.scenes = [
    // scene 1
    {
      duration: 10000,
      update: null,
      passes: [
        {
          render: draw_mesh(_cube),
          program: cube_prog,
        }
      ]
    },
    {
      name:"intro", //#opt
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
    {
      name:"mrt", //#opt
      duration: 1000,
      passes: [
        {
          program: mrt_1,
          render: draw_quad,
          outputs: [tex1, tex2],
        },
        {
          texture_inputs: [tex2, tex1],
          render: draw_quad,
          program: mrt_2,
          // no outputs, means render to screen
        }
      ]
    },
    // scene 2, render nothing for 700ms 
    {
      duration: 700,
      passes: []
    },
    // scene 2
    {
      name:"blue", //#opt
      duration: 10000,
      passes: [
        {
          program: scene_blue,
          render: draw_quad,
        },
      ]
    },
    {
      duration: 1000,
      passes: []
    },

  ];
}
