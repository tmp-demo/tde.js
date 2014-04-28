
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

function circle_ring(radius, num_edges, z) {
  var a = 2 * Math.PI / num_edges;
  var r = []; 
  for (var i = 0; i < num_edges; ++i) {
    r.push([radius*Math.cos(i*a), radius*Math.sin(i*a), z]);
    r.push([radius*Math.cos((i+1)*a), radius*Math.sin((i+1)*a), z]);
  }
  return r;
}

function transform_ring(r, index, mat) {
  var r2 = [];
  var rot = 0.03; // completely arbitrary
  mat4.rotate(mat, mat, rot, [0.0, 0.0, 1.0]);
  mat4.translate(mat, mat, [0.0, 0.0, 1.0]);
  mat4.rotate(mat, mat, rot, [0.0, 1.0, 0.0]);
  //mat4.rotate(mat, mat, rot, [1.0, 0.0, 0.0]);
  for (var i = 0; i < r.length; ++i) {
    var p = [];
    vec3.transformMat4(p, r[i], mat);
    r2.push(p);
  }
  return r2;
}

function generate_some_geometry() {
  var num_edges = 10;
  var num_steps = 20;
  var geom = {
    vbo: new Float32Array(num_steps*num_edges*4*8),
    ibo: new Uint16Array(num_steps*num_edges*12),
    v_stride: 8,
    v_cursor: 0,
    i_cursor: 0
  }

  var mat = mat4.create();
  var r1 = circle_ring(4, num_edges, 0);
  for (var i = 0; i<num_steps; ++i) {
    var r2 = transform_ring(r1, 0, mat);
    join_rings(geom, r1, r2);
    r1 = r2;
  }

  compute_normals(geom, 3, 0, 6*num_edges*num_steps);

  return create_geom(geom.vbo, geom.ibo, 8, [
    { location: POS, components: 3, stride: 32, offset: 0 },
    { location: NORMALS, components: 3, stride: 32, offset: 12 },
    { location: TEX_COORDS, components: 2, stride: 32, offset: 24 }
  ]);
}

function prepare() {

  demo_uniforms = [
    {name: "demo_time", type: F32},
    {name: "clip_time", type: F32},
    {name: "clip_time_norm", type: F32},
    {name: "clip_duration", type: F32},
    {name: "beat", type: F32},
    {name: "fade", type: F32},
    {name: "near_plane", type: F32},
    {name: "far_plane", type: F32},
    {name: "resolution", type: VEC2},
    {name: "texture_0", type: TEX},
    {name: "texture_1", type: TEX},
    {name: "texture_2", type: TEX},
    {name: "texture_3", type: TEX},
    {name: "model_mat", type: MAT4},
    {name: "view_mat", type: MAT4},
    {name: "proj_mat", type: MAT4},
    {name: "view_proj_mat", type: MAT4}
  ]

  demo.w = 800;
  demo.h = 600;
  // here goes the code that declares the resources to load
  // TODO - proper shader pipeline

  // every object of layout { src:<source code>, ... } in vertex_shaders will
  // be compiled as a vertex shader in an additional shader member
  // -> { src: <srouce code>, shader: <shader object>, ... }
  // see gfx_init
  load_text("quad.vs", function(data) { vertex_shaders.quad = { src: data} } );
  load_text("basic3d.vs", function(data) { vertex_shaders.basic_3d = { src: data } } );

  // same for frahment shaders
  load_text("red.fs", function(data) { fragment_shaders.red = { src: data } } );
  load_text("blue.fs", function(data) { fragment_shaders.blue = { src: data } } );
  load_text("chroma.fs", function(data) { fragment_shaders.chroma = { src: data } } );
  load_text("textured.fs", function(data) { fragment_shaders.textured = { src: data } } );
  load_text("show_normals.fs", function(data) { fragment_shaders.show_normals = { src: data } } );
  load_text("show_tex_coords.fs", function(data) { fragment_shaders.show_tex_coords = { src: data } } );
  load_text("dblur.fs", function(data) { fragment_shaders.directional_blur = { src: data } } );
  load_text("select4.fs", function(data) { fragment_shaders.select = { src: data } } );
  // comment out the line below if you don't have support for WEBGL_draw_buffers
  load_text("deferred.fs", function(data) { fragment_shaders.deferred = { src: data } } );
  load_text("show_deferred.fs", function(data) { fragment_shaders.show_deferred = { src: data } } );
  load_text("post_test.fs", function(data) { fragment_shaders.post_test = { src: data } } );

  load_audio("z.ogg", function(data) { zogg = data });

  load_image("paul.jpg", function(data) { image_paul = data; });
  load_image("bricks.png", function(data) { image_bricks = data; });
}

function blur_pass(in_tex, out_tex, vec, res) {
  var p = {
    texture_inputs: [in_tex],
    update: function(_, pass, time) {
      var NB_TAPS = 10
      var dx = vec[0] / NB_TAPS / res[0];
      var dy = vec[1] / NB_TAPS / res[1];
      gl.uniform2f(gl.getUniformLocation(programs.dblur.program, "step"), dx, dy);
    },
    render: draw_quad,
    program: programs.dblur
  }
  if (out_tex) {
    p.render_to = {color: [out_tex], w: res[0], h: res[1]};
  }
  return p;
}

function demo_init() {
  console.log("demo_init"); // #debug

  // all of the objects in programs are compiled at the beginning of the demo
  // -> programs.<name> = { vs: <shader>, fs:<shader>, program: <program> }
  // the shaders specified below are the "wrapper" objects that contain also
  // the source, not just the gl object.
  // see gfx_init

  // comment out program.deferred if you don't have support for
  // WEBGL_draw_buffers
  programs.deferred = {
    vs: vertex_shaders.basic_3d,
    fs: fragment_shaders.deferred
  };
  programs.show_deferred = {
    vs: vertex_shaders.quad,
    fs: fragment_shaders.show_deferred
  };
  programs.post_misc = {
    vs: vertex_shaders.quad,
    fs: fragment_shaders.post_test
  };
  programs.textured = {
    vs: vertex_shaders.basic_3d,
    fs: fragment_shaders.textured
  };
  programs.show_normals = {
    vs: vertex_shaders.basic_3d,
    fs: fragment_shaders.show_normals
  };
  programs.show_tex_coords = {
    vs: vertex_shaders.basic_3d,
    fs: fragment_shaders.show_tex_coords
  };
  programs.dblur = {
    vs: vertex_shaders.quad,
    fs: fragment_shaders.directional_blur
  };
  programs.select4 = {
    vs: vertex_shaders.quad,
    fs: fragment_shaders.select
  };
  programs.blue = {
    vs: vertex_shaders.quad,
    fs: fragment_shaders.blue
  };

  depth_rb   = create_depth_buffer(canvas.width, canvas.height);
  depth_half = create_depth_buffer(canvas.width/2,canvas.height/2);
  blur1      = { tex: create_texture(canvas.width/2, canvas.height/2) };
  blur2      = { tex: create_texture(canvas.width/2, canvas.height/2) };
  blur3      = { tex: create_texture(canvas.width/2, canvas.height/2) };
  tex_half1  = { tex: create_texture(canvas.width/2, canvas.height/2) };
  tex_paul   = { tex: create_texture(image_paul.width, image_paul.height, gl.RGBA, image_paul.data) };
  tex1       = { tex: create_texture() };
  tex2       = { tex: create_texture() };
  tex_bricks = { tex: create_texture(image_bricks.width, image_bricks.height, gl.RGBA, image_bricks.data, true) };

  geometries.cube = create_geom([
    // Front face     | normals        | tex coords
    -1.0, -1.0,  1.0,   0.0, 0.0, 1.0,   1.0, 0.0,
     1.0, -1.0,  1.0,   0.0, 0.0, 1.0,   1.0, 1.0,
     1.0,  1.0,  1.0,   0.0, 0.0, 1.0,   0.0, 1.0,
    -1.0,  1.0,  1.0,   0.0, 0.0, 1.0,   0.0, 0.0,
    // Back face
    -1.0, -1.0, -1.0,   0.0, 0.0, -1.0,  1.0, 0.0,
    -1.0,  1.0, -1.0,   0.0, 0.0, -1.0,  1.0, 1.0,
     1.0,  1.0, -1.0,   0.0, 0.0, -1.0,  0.0, 1.0,
     1.0, -1.0, -1.0,   0.0, 0.0, -1.0,  0.0, 0.0,
    // Top face
    -1.0,  1.0, -1.0,   0.0, 1.0, 1.0,   1.0, 0.0,
    -1.0,  1.0,  1.0,   0.0, 1.0, 1.0,   1.0, 1.0,
     1.0,  1.0,  1.0,   0.0, 1.0, 1.0,   0.0, 1.0,
     1.0,  1.0, -1.0,   0.0, 1.0, 1.0,   0.0, 0.0,
    // Bottom face
    -1.0, -1.0, -1.0,   0.0, -1.0, 1.0,  1.0, 0.0,
     1.0, -1.0, -1.0,   0.0, -1.0, 1.0,  1.0, 1.0,
     1.0, -1.0,  1.0,   0.0, -1.0, 1.0,  0.0, 1.0,
    -1.0, -1.0,  1.0,   0.0, -1.0, 1.0,  0.0, 0.0,
    // Right face
     1.0, -1.0, -1.0,   1.0, 0.0, 1.0,   1.0, 0.0,
     1.0,  1.0, -1.0,   1.0, 0.0, 1.0,   1.0, 1.0,
     1.0,  1.0,  1.0,   1.0, 0.0, 1.0,   0.0, 1.0,
     1.0, -1.0,  1.0,   1.0, 0.0, 1.0,   0.0, 0.0,
    // Left face
    -1.0, -1.0, -1.0,  -1.0, 0.0, 1.0,   1.0, 0.0,
    -1.0, -1.0,  1.0,  -1.0, 0.0, 1.0,   1.0, 1.0,
    -1.0,  1.0,  1.0,  -1.0, 0.0, 1.0,   0.0, 1.0,
    -1.0,  1.0, -1.0,  -1.0, 0.0, 1.0,   0.0, 0.0
  ],[
    0,  1,  2,    0,  2,  3,  // Front face
    4,  5,  6,    4,  6,  7,  // Back face
    8,  9,  10,   8,  10, 11, // Top face
    12, 13, 14,   12, 14, 15, // Bottom face
    16, 17, 18,   16, 18, 19, // Right face
    20, 21, 22,   20, 22, 23  // Left face
  ], 8, [
    { location: POS, components: 3, stride: 32, offset: 0 },
    { location: NORMALS, components: 3, stride: 32, offset: 12 },
    { location: TEX_COORDS, components: 2, stride: 32, offset: 24 }
  ]);

  geometries.extruded = generate_some_geometry();

  if (window.scene_model) {
    geometries.cube = scene_model();
  }

  var cameraPosition = vec3.create()
  var viewMatrix = mat4.create()
  var projectionMatrix = mat4.create()
  var viewProjectionMatrix = mat4.create()

  demo.scenes = [
    // scene 1 - comment it out if you don't have support for WEBGL_draw_buffers
    {
      duration: 10000,
      update: null,
      passes: [
        {
          render_to: {color: [tex1, tex2], depth: depth_rb}, render: clear
        },
        {
          texture_inputs: [tex_bricks],
          render_to: {color: [tex1, tex2], depth: depth_rb},
          update: function(scenes, scene, time) {
            vec3.lerp(cameraPosition, [5.0, -2.0, 5.0], [20.0, 0.0, 3.0], time.scene_norm);
            mat4.lookAt(viewMatrix, cameraPosition, [0.0,0.0,-5.0], [0.0, 0.0, 1.0]);
            mat4.perspective(projectionMatrix, 75 * Math.PI / 180.0, 1.5, 0.5, 100.0)
            mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
            uniforms["view_proj_mat"].val = viewProjectionMatrix;
          },
          render: draw_mesh(geometries.cube),
          program: programs.deferred
        },
        {
          texture_inputs: [tex1, tex2],
          render: draw_quad,
          program: programs.show_deferred
        }
      ]
    },
    {
      duration: 10000,
      update: null,
      passes: [
        {
          render_to: {color: [tex1], depth: depth_rb}, render: clear
        },
        {
          texture_inputs: [tex_paul],
          render_to: {color: [tex1], depth: depth_rb},
          update: function(scenes, scene, time) {
            vec3.lerp(cameraPosition, [0.0, -10.0, 10.0], [10.0, 0.0, 3.0], time.scene_norm);
            mat4.lookAt(viewMatrix, cameraPosition, [0.0,0.0,0.0], [0.0, 0.0, 1.0]);
            mat4.perspective(projectionMatrix, 75 * Math.PI / 180.0, 1.5, 0.5, 100.0)
            mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
            uniforms["view_proj_mat"].val = viewProjectionMatrix;
          },
          render: draw_mesh(geometries.cube),
          program: programs.show_normals
        },
        blur_pass(
          tex1, tex_half1,
          [10.0, 0.0],
          [400, 300]
        ),
        blur_pass(
          tex_half1, blur1,
          [0.0, 10.0],
          [400, 300]
        ),
        blur_pass(
          blur1, tex_half1,
          [10.0, 0.0],
          [400, 300]
        ),
        blur_pass(
          tex_half1, blur2,
          [0.0, 10.0],
          [400, 300]
        ),
        blur_pass(
          blur2, tex_half1,
          [10.0, 0.0],
          [400, 300]
        ),
        blur_pass(
          tex_half1, blur3,
          [0.0, 10.0],
          [400, 300]
        ),
        {
          texture_inputs: [tex1, blur1, blur2, blur3],
          render: draw_quad,
          program: programs.select4
        }
      ]
    },
    {
      duration: 10000,
      passes: [
        {
          render: clear
        },
        {
          update: function(scenes, scene, time) {
            vec3.lerp(cameraPosition, [30.0, -40.0, 10.0], [10.0, 0.0, 100.0], time.scene_norm);
            mat4.lookAt(viewMatrix, cameraPosition, [0.0,0.0,50.0], [0.0, 0.0, 1.0]);
            mat4.perspective(projectionMatrix, 75 * Math.PI / 180.0, 1.5, 0.5, 100.0)
            mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
            uniforms["view_proj_mat"].val = viewProjectionMatrix;
          },
          render: draw_mesh(geometries.extruded),
          program: programs.show_normals
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
      name:"blue", //#debug
      duration: 10000,
      passes: [
        {
          program: programs.blue,
          render: draw_quad
        }
      ]
    },
    {
      duration: 1000,
      passes: []
    }
  ];

  demo.audio_source = demo.ac.createBufferSource();
  demo.audio_source.buffer = zogg;
  demo.audio_source.connect(demo.audio_sink);
}
