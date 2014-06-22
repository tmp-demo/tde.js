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

function blur_pass(in_tex, out_tex, vec, res) {
  var p = {
    texture_inputs: [in_tex],
    update: function(_, pass, time) {
      var NB_TAPS = 10
      var dx = vec[0] / NB_TAPS / out_tex.width;
      var dy = vec[1] / NB_TAPS / out_tex.height;
      uniforms["step"] = [dx, dy];
    },
    render: draw_quad,
    program: programs.dblur
  }
  if (out_tex) {
    p.render_to = {color: [out_tex]};
  }
  return p;
}

function mesurebondingBox(cvs, c){

  alphaThreshold = 15;
  var minX=+Infinity,minY=+Infinity,maxX=-Infinity,maxY=-Infinity;
  var w=cvs.width,h=cvs.height;
  var data = c.getImageData(0,0,w,h).data;
  for (var x=0;x<w;++x){
    for (var y=0;y<h;++y){
      var a = data[(w*y+x)*4+3];
      if (a>alphaThreshold){
        if (x>maxX) maxX=x;
        if (y>maxY) maxY=y;
        if (x<minX) minX=x;
        if (y<minY) minY=y;
      }
    }
  }
  return {minX : minX-2, minY : minY-2, maxX : maxX+2, maxY : maxY+2, width : maxX-minX+4, height:maxY-minY+4};
}
function prepareTextTextures(texts){
  var cvs = document.createElement("canvas");
  var w = cvs.width = 2048;
  var h = cvs.height = 1024;
  var c = cvs.getContext("2d");
  
  var bb = {};
  
  // flip context so the texture looks in the correct direction in shaders.
  c.scale(1, -1);
  c.fillStyle="#FFFFFF";
  
  for (var i = 0; i < texts.length ; i++){
  

    c.font=texts[i].font;  
    var txt = texts[i].text;
    c.fillText(txt,0,-512);
    
    bb = mesurebondingBox(cvs, c);  
    
    textures[texts[i].id] = create_texture(bb.width, bb.height, gl.RGBA, c.getImageData(bb.minX, bb.minY, bb.width,  bb.height).data, false);
    uniforms["textDim_"+texts[i].id] = [bb.width, bb.height];
    c.clearRect ( -2048 , -2048 , 4096 , 4096 );   
  }

}

function demo_init() {
  console.log("demo_init"); // #debug
  
  var width = demo.w;
  var height = demo.h;

  depth_rb   = create_depth_buffer(width, height);
  depth_half = create_depth_buffer(width/2,height/2);

  textures.blur1      = create_texture(width/2, height/2);
  textures.blur2      = create_texture(width/2, height/2);
  textures.blur3      = create_texture(width/2, height/2);
  textures.tex_half1  = create_texture(width/2, height/2);
  textures.tex1       = create_texture();
  textures.tex2       = create_texture();
  textures.noise      = create_texture(256,256, null, null, true);
  
  //Note textures.text... is reserved for holding text to be displayed
  prepareTextTextures([
    { id: "hw", text: "Hello World !", font: "200px OCR A STD" },
    { id: "tmp", text: "/tmp", font: "200px OCR A STD"  },
    { id: "scroll", text: "this is a stupid text to be scrolled. and here is a few more for the sake of length, this is a stupid text to be scrolled. and here is a few more for the sake of length this is a stupid text to be scrolled. and here is a few more for the sake of length, this is a stupid text to be scrolled. and here is a few more for the sake of length", font: "20px cursive"  }
  ]);

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
    {
      duration: 0,
      passes: [
        {
          render_to: {color: [textures.noise]},
          render: draw_quad,
          program: programs.noise
        }
      ]
    },
    //{
    //  duration: 10000,
    //  passes: [
    //    {
    //      render: draw_quad,
    //      program: programs.raymarchvoxel
    //    }
    //  ]
    //},
    {
      duration: 10000,
      passes: [
        {
          texture_inputs: [textures["scroll"]],
          render: draw_quad,
          program: programs.scrolltext
        }
      ]
    },
    {
      duration: 10000,
      passes: [
        {
          texture_inputs: [textures["hw"]],
          render: draw_quad,
          program: programs.printtext
        }
      ]
    },
    {
      duration: 10000,
      passes: [
        {
          render: draw_quad,
          program: programs.raymarch
        }
      ]
    },
    {
      duration: 10000,
      update: null,
      passes: [
        {
          render_to: {color: [textures.tex1, textures.tex2], depth: depth_rb},
          render: clear
        },
        {
          texture_inputs: [textures.noise],
          render_to: {color: [textures.tex1, textures.tex2], depth: depth_rb},
          update: function(scenes, scene, time) {
            vec3.lerp(cameraPosition, [2.0, -2.0, 1.0], [3.0, 0.0, 2.0], time.scene_norm);
            mat4.lookAt(viewMatrix, cameraPosition, [0.0,0.0,0.0], [0.0, 0.0, 1.0]);
            mat4.perspective(projectionMatrix, 75 * Math.PI / 180.0, width/height, 0.5, 100.0)
            mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
            uniforms["view_proj_mat"] = viewProjectionMatrix;
          },
          render: draw_mesh(geometries.cube),
          program: programs.deferred
        },
        {
          texture_inputs: [textures.tex1, textures.tex2],
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
          render_to: {color: [textures.tex1], depth: depth_rb}, render: clear
        },
        {
          texture_inputs: [],
          render_to: {color: [textures.tex1], depth: depth_rb},
          update: function(scenes, scene, time) {
            vec3.lerp(cameraPosition, [0.0, -10.0, 10.0], [10.0, 0.0, 3.0], time.scene_norm);
            mat4.lookAt(viewMatrix, cameraPosition, [0.0,0.0,0.0], [0.0, 0.0, 1.0]);
            mat4.perspective(projectionMatrix, 75 * Math.PI / 180.0, width/height, 0.5, 100.0)
            mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
            uniforms["view_proj_mat"] = viewProjectionMatrix;
          },
          render: draw_mesh(geometries.cube),
          program: programs.show_normals
        },
        blur_pass(
          textures.tex1, textures.tex_half1,
          [10.0, 0.0]
        ),
        blur_pass(
          textures.tex_half1, textures.blur1,
          [0.0, 10.0]
        ),
        blur_pass(
          textures.blur1, textures.tex_half1,
          [10.0, 0.0]
        ),
        blur_pass(
          textures.tex_half1, textures.blur2,
          [0.0, 10.0]
        ),
        blur_pass(
          textures.blur2, textures.tex_half1,
          [10.0, 0.0]
        ),
        blur_pass(
          textures.tex_half1, textures.blur3,
          [0.0, 10.0]
        ),
        {
          texture_inputs: [textures.tex1, textures.blur1, textures.blur2, textures.blur3],
          render: draw_quad,
          program: programs.select4
        }
      ]
    },
    {
      duration: 20000,
      passes: [
        {
          render: clear
        },
        {
          update: function(scenes, scene, time) {
            vec3.lerp(cameraPosition, [30.0, -40.0, 10.0], [10.0, 0.0, 100.0], time.scene_norm);
            mat4.lookAt(viewMatrix, cameraPosition, [0.0,0.0,50.0], [0.0, 0.0, 1.0]);
            mat4.perspective(projectionMatrix, 75 * Math.PI / 180.0, width/height, 0.5, 100.0)
            mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
            uniforms["view_proj_mat"] = viewProjectionMatrix;
          },
          render: draw_mesh(geometries.extruded),
          program: programs.show_normals
        }
      ]
    }
  ];
}
