
function gl_init() {
  canvas = document.getElementsByTagName("canvas")[0];
  gl = canvas.getContext("experimental-webgl");
  canvas.width = demo.w;
  canvas.height = demo.h;
  gl.viewport(0, 0, demo.w, demo.h);
  ext = {
    draw_buffers: gl.getExtension("WEBGL_draw_buffers"),
  };
  /*#opt*/if (!ext.draw_buffers) {
  /*#opt*/  alert("Multiple render targets not supported :(");
  /*#opt*/}

  _cube = init_cube();

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  var quad = new Float32Array([-1, -1,
                                1, -1,
                               -1,  1,
                                1, -1,
                                1,  1,
                               -1,  1]);
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
  _quad_vbo = buffer;
 
  // get readable strings for error enum values
  for (var propertyName in gl) {               //#opt
    if (typeof gl[propertyName] == 'number') { //#opt
      _enums[gl[propertyName]] = propertyName; //#opt
    }                                          //#opt
  }                                            //#opt
}

_cube = null;
_quad_vbo = null;
_enums = _enums = { }; //#opt

_locations = [
  "position",
  "tex_coords",
  "color",
];

POS = 0;
TEX_COORDS = 1;
COLOR = 2;

function gl_error() {                                      //#opt
  var v = gl.getError();                                   //#opt
  var name = _enums[v];                                    //#opt
  return (name !== undefined) ? ("gl." + name) :           //#opt
      ("/*UNKNOWN WebGL ENUM*/ 0x" + v.toString(16) + ""); //#opt
}                                                          //#opt

function gfx_init() {
  // replace the render passes' texture arrays by actual frame buffer objects
  for (var s=0; s<demo.scenes.length; ++s) {
    var scene = demo.scenes[s];
    for (var p=0; p<scene.passes.length; ++p) {
      var pass = scene.passes[p];
      if (pass.outputs) {
        pass.outputs = frame_buffer(pass.outputs);
      }
    }
  }
}

function init_cube() {
  var cube = new Float32Array([
      // Front face     | tex coords
      -1.0, -1.0,  1.0,   0.0, 0.0,
       1.0, -1.0,  1.0,   1.0, 0.0,
       1.0,  1.0,  1.0,   1.0, 1.0,
      -1.0,  1.0,  1.0,   0.0, 1.0,
      // Back face
      -1.0, -1.0, -1.0,   0.0, 0.0,
      -1.0,  1.0, -1.0,   1.0, 0.0,
       1.0,  1.0, -1.0,   1.0, 1.0,
       1.0, -1.0, -1.0,   0.0, 1.0,
      // Top face
      -1.0,  1.0, -1.0,   0.0, 0.0,
      -1.0,  1.0,  1.0,   1.0, 0.0,
       1.0,  1.0,  1.0,   1.0, 1.0,
       1.0,  1.0, -1.0,   0.0, 1.0,
      // Bottom face
      -1.0, -1.0, -1.0,   0.0, 0.0,
       1.0, -1.0, -1.0,   1.0, 0.0,
       1.0, -1.0,  1.0,   1.0, 1.0,
      -1.0, -1.0,  1.0,   0.0, 1.0,
      // Right face
       1.0, -1.0, -1.0,   0.0, 0.0,
       1.0,  1.0, -1.0,   1.0, 0.0,
       1.0,  1.0,  1.0,   1.0, 1.0,
       1.0, -1.0,  1.0,   0.0, 1.0,
      // Left face
      -1.0, -1.0, -1.0,   0.0, 0.0,
      -1.0, -1.0,  1.0,   1.0, 0.0,
      -1.0,  1.0,  1.0,   1.0, 1.0,
      -1.0,  1.0, -1.0,   0.0, 1.0
  ]);
  for (var i = 0; i<cube.length; ++i) {
    cube[i] = cube[i]*0.5;
  }
  var vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, cube, gl.STATIC_DRAW);

  var idx = new Uint16Array([
    0,  1,  2,    0,  2,  3,  // Front face
    4,  5,  6,    4,  6,  7,  // Back face
    8,  9,  10,   8,  10, 11, // Top face
    12, 13, 14,   12, 14, 15, // Bottom face
    16, 17, 18,   16, 18, 19, // Right face
    20, 21, 22,   20, 22, 23  // Left face
  ]);
  var ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  return {
    vbo: vbo,
    ibo: ibo,
    num_indices: idx.length,
    components_per_vertex: 5,
    attribs: [
      { location: POS, components: 3, stride: 20, offset: 0 },
      { location: TEX_COORDS, components: 2, stride: 20, offset: 16 }
    ]
  };
}

// TODO[nical]
//function look_at(eye, at, up mat) {
//  zaxis = normal(At - Eye)
//  xaxis = normal(cross(Up, zaxis))
//  yaxis = cross(zaxis, xaxis)
//
//  mat[0] = 
//   xaxis.x           yaxis.x           zaxis.x          0
//   xaxis.y           yaxis.y           zaxis.y          0
//   xaxis.z           yaxis.z           zaxis.z          0
//  -dot(xaxis, eye)  -dot(yaxis, eye)  -dot(zaxis, eye)  l
//
//}

function draw_quad() {
  gl.disable(gl.DEPTH_TEST);
  gl.bindBuffer(gl.ARRAY_BUFFER, _quad_vbo);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// actually renders
function draw_geom(data, prog) {
  gl.enable(gl.DEPTH_TEST);
  gl.bindBuffer(gl.ARRAY_BUFFER, data.vbo);
  for (var c in data.attribs) {
  gl.enableVertexAttribArray(c);
    var a = data.attribs[c];
    gl.vertexAttribPointer(a.location, a.components, gl.FLOAT,
      false, a.stride, a.offset);
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, data.ibo);
  gl.drawElements(gl.TRIANGLES, data.num_indices, gl.UNSIGNED_SHORT, 0);
}

// to use with the timeline
function draw_mesh(data) {
  return function(prog) {
    draw_geom(data, prog);
  }
}

// type: gl.VERTEX_PROGRAM or gl.FRAGMENT_PROGRAM
function compile_shader(txt_src, type) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, txt_src);
  gl.compileShader(shader);
  if ( !gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {             //#opt
    alert("Shader compilation failed: " + gl.getShaderInfoLog(shader)); //#opt
  }                                                                     //#opt
  return shader;
}

function shader_program(vs, fs) {
  var program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  for (var i in _locations) {
    gl.bindAttribLocation(program, i, _locations[i]);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {       //#opt
    alert("Program link error: " +                              //#opt
          gl.getProgramParameter(program, gl.VALIDATE_STATUS) + //#opt
          "\nERROR: " + gl_error());                            //#opt
  }                                                             //#opt
  return program;
}

function create_texture() {
  var texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);//this texture is used to store render output for post process.

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0,
                gl.RGBA, gl.UNSIGNED_BYTE, null);

  return texture;
}

function texture_unit(i) { return gl.TEXTURE0+i; }

function color_attachment(i) {
  return ext.draw_buffers.COLOR_ATTACHMENT0_WEBGL+i;
}

/*#opt*/function frame_buffer_error(e) {
/*#opt*/  if (e == gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT) {
/*#opt*/      return "FRAMEBUFFER_INCOMPLETE_ATTACHMENT";}
/*#opt*/  if (e == gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT) {
/*#opt*/      return "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";}
/*#opt*/  if (e == gl.FRAMEBUFFER_INCOMPLETE_DRAW_BUFFER) {
/*#opt*/      return "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";}
/*#opt*/  if (e == gl.FRAMEBUFFER_UNSUPPORTED) {
/*#opt*/      return "FRAMEBUFFER_UNSUPPORTED";}
/*#opt*/  if (e == gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE) {
/*#opt*/      return "FRAMEBUFFER_INCOMPLETE_MULTISAMPLE";}
/*#opt*/  return "unknown framebuffer error";
/*#opt*/}

function frame_buffer(textures) {
  var fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  var buffers = [];
  for (var t=0; t<textures.length;++t) {
      gl.framebufferTexture2D(gl.FRAMEBUFFER, color_attachment(t), gl.TEXTURE_2D, textures[t], 0);
      buffers.push(ext.draw_buffers.COLOR_ATTACHMENT0_WEBGL+t)
  }

  ext.draw_buffers.drawBuffersWEBGL(buffers);
  var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);         //#opt
  if (status != gl.FRAMEBUFFER_COMPLETE) {                        //#opt
    alert("incomplete framebuffer "+frame_buffer_error(status));  //#opt
  }                                                               //#opt
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return fbo;
}

function set_basic_uniforms(scene, program) {
  var current = demo.current_time - scene.start_time;
  //console.log("current_time:"+demo.current_time+" scene time:"+current+" "+"duration:"+scene.duration);
  gl.uniform1f(gl.getUniformLocation(program, 'time'), current);
  gl.uniform1f(gl.getUniformLocation(program, 'duration'), scene.duration);
  gl.uniform2f(gl.getUniformLocation(program, 'resolution'), canvas.width, canvas.height);
  // TODO beat detector
  gl.uniform1f(gl.getUniformLocation(program, 'beat'), 0.0/*bd.beat()*/);
}

function render_scene(scene) {
  //console.log("render_scene "+scene.name+" "+demo.current_time);
  if (scene.update) {
    console.log("scene.update");
    scene.update(demo.scenes, scene);
  }
  for (var p in scene.passes) {
    var pass = scene.passes[p];
    gl.useProgram(pass.program);

    set_basic_uniforms(scene, pass.program);
    if (pass.outputs) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, pass.outputs);
    }
    if (pass.update) {
      pass.update(scene, pass);
    }
    if (pass.texture_inputs) {
      for (var i=0; i<pass.texture_inputs.length; ++i) {
        var tex = pass.texture_inputs[i];
        gl.activeTexture(texture_unit(i));
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(gl.getUniformLocation(pass.program,"texture_"+i), i);
      }
    }
    pass.render(pass.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}
