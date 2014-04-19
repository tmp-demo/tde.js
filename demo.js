
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
  load_text("textured.fs", function(data) { texturing = data; } );
  load_text("dblur.fs", function(data) { dblur_src = data; } );
  load_text("select4.fs", function(data) { select_src = data; } );
  load_audio("z.ogg", function(data) { zogg = data });

  load_image("paul.jpg", function(data) { image_paul = data; });
}

function view(eye1, target1, up1,  eye2, target2, up2) {
  return function(t) {
    var eye = mix3(eye1, eye2, t);
    var target = mix3(target1, target2, t);
    var up = mix3(up1, up2, t);
    var mat = new Float32Array(16);
    look_at(eye, target, up, mat);
    return mat;
  }
}

function blur_pass(in_tex, out_tex, vec, res, duration) {
  var p = {
    texture_inputs: [in_tex],
    update: function(_, pass, time) {
      var dx = vec[0]/res[0];
      var dy = vec[1]/res[1];
      gl.uniform2f(gl.getUniformLocation(pass.program, "direction"), dx, dy);
    },
    render: draw_quad,
    program: dblur,
  }
  if (out_tex) {
    p.render_to = {color: [out_tex], w: res[0], h: res[1]};
  }
  return p;
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
  mrt_fs_1 = compile_shader(mrt_1_src, FS);
  mrt_fs_2 = compile_shader(mrt_2_src, FS);
  texturing_fs = compile_shader(texturing, FS);
  dblur_fs = compile_shader(dblur_src, FS);
  select_fs = compile_shader(select_src, FS);

  cube_prog = shader_program(vs_basic3d, texturing_fs);
  dblur = shader_program(vs_basic, dblur_fs);
  select4 = shader_program(vs_basic, select_fs);
  scene_1_1 = shader_program(vs_basic, fs_intro1);
  scene_1_2 = shader_program(vs_basic, fs_intro2);
  scene_blue = shader_program(vs_basic, fs_blue);
  mrt_1 = shader_program(vs_basic, mrt_fs_1);
  mrt_2 = shader_program(vs_basic, mrt_fs_2);

  depth_rb = create_depth_buffer(canvas.width, canvas.height);
  blur1 = create_texture(canvas.width/2, canvas.height/2);
  blur2 = create_texture(canvas.width/2, canvas.height/2);
  blur3 = create_texture(canvas.width/2, canvas.height/2);
  tex_half1 = create_texture(canvas.width/2, canvas.height/2);
  depth_half = create_depth_buffer(canvas.width/2,canvas.height/2);
  tex1 = create_texture();
  tex2 = create_texture();
  tex_image = create_texture(image_paul.width, image_paul.height, gl.RGBA, image_paul.data);

  cube = create_geom([
    // Front face     | tex coords
    -1.0, -1.0,  1.0,   1.0, 0.0,
     1.0, -1.0,  1.0,   1.0, 1.0,
     1.0,  1.0,  1.0,   0.0, 1.0,
    -1.0,  1.0,  1.0,   0.0, 0.0,
    // Back face
    -1.0, -1.0, -1.0,   1.0, 0.0,
    -1.0,  1.0, -1.0,   1.0, 1.0,
     1.0,  1.0, -1.0,   0.0, 1.0,
     1.0, -1.0, -1.0,   0.0, 0.0,
    // Top face
    -1.0,  1.0, -1.0,   1.0, 0.0,
    -1.0,  1.0,  1.0,   1.0, 1.0,
     1.0,  1.0,  1.0,   0.0, 1.0,
     1.0,  1.0, -1.0,   0.0, 0.0,
    // Bottom face
    -1.0, -1.0, -1.0,   1.0, 0.0,
     1.0, -1.0, -1.0,   1.0, 1.0,
     1.0, -1.0,  1.0,   0.0, 1.0,
    -1.0, -1.0,  1.0,   0.0, 0.0,
    // Right face
     1.0, -1.0, -1.0,   1.0, 0.0,
     1.0,  1.0, -1.0,   1.0, 1.0,
     1.0,  1.0,  1.0,   0.0, 1.0,
     1.0, -1.0,  1.0,   0.0, 0.0,
    // Left face
    -1.0, -1.0, -1.0,   1.0, 0.0,
    -1.0, -1.0,  1.0,   1.0, 1.0,
    -1.0,  1.0,  1.0,   0.0, 1.0,
    -1.0,  1.0, -1.0,   0.0, 0.0
  ],[
    0,  1,  2,    0,  2,  3,  // Front face
    4,  5,  6,    4,  6,  7,  // Back face
    8,  9,  10,   8,  10, 11, // Top face
    12, 13, 14,   12, 14, 15, // Bottom face
    16, 17, 18,   16, 18, 19, // Right face
    20, 21, 22,   20, 22, 23  // Left face
  ], 5, [
    { location: POS, components: 3, stride: 20, offset: 0 },
    { location: TEX_COORDS, components: 2, stride: 20, offset: 12 }
  ]);

  demo.scenes = [
    // scene 1
    {
      duration: 10000,
      update: null,
      passes: [
        {
          render_to: {color: [tex1], depth: depth_rb}, render: clear
        },
        {
          texture_inputs: [tex_image],
          render_to: {color: [tex1], depth: depth_rb},
          update: function(scenes, scene, time) {
            var mv = view([0.0, 0.0,-4.0], [0.0,0.0,0.0], [0.0, -1.0,0.0],
                          [3.0, 0.0, 0.0], [0.0,0.0,0.0], [0.0, -1.0,0.0])(exp(time.scene_norm));
            var proj = perspective(75, 1.5, 0.5, 100.0)
            var mat = mat4_multiply(proj, mv);
            camera(scene.program, proj);
          },
          render: draw_mesh(cube),
          program: cube_prog,
        },
        blur_pass(
          tex1, tex_half1,
          [1.0, 0.0],
          [400, 300]
        ),
        blur_pass(
          tex_half1, blur1,
          [0.0, 1.0],
          [400, 300]
        ),
        blur_pass(
          blur1, tex_half1,
          [1.0, 0.0],
          [400, 300]
        ),
        blur_pass(
          tex_half1, blur2,
          [0.0, 1.0],
          [400, 300]
        ),
        blur_pass(
          blur2, tex_half1,
          [1.0, 0.0],
          [400, 300]
        ),
        blur_pass(
          tex_half1, blur3,
          [0.0, 1.0],
          [400, 300]
        ),
        {
          texture_inputs: [tex1, blur1, blur2, blur3],
          render: draw_quad,
          program: select4,
        }
      ]
    },
    {
      duration: 10000,
      update: null,
      passes: [
        {
          update: null,
          program: scene_1_1,
          render: draw_quad,
          render_to: {color: [tex1]},
        },
        {
          texture_inputs: [tex1],
          update: function() {},
          render: draw_quad,
          program: scene_1_2,
          // no render_to, means render to screen
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
          render_to: {color: [tex1, tex2]},
        },
        {
          texture_inputs: [tex2, tex1],
          render: draw_quad,
          program: mrt_2,
          // no render_to, means render to screen
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

  demo.audio_source = demo.ac.createBufferSource();
  demo.audio_source.buffer = zogg;
  demo.audio_source.connect(demo.audio_sink);
}
