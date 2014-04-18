
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

function create_geom(vertices, indices, comp_per_vertex, attrib_list) {
  var vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  var ibo = gl.createBuffer();
  var idx = new Uint16Array(indices);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  return {
    vbo: vbo,
    ibo: ibo,
    num_indices: idx.length,
    components_per_vertex: comp_per_vertex,
    attribs: attrib_list,
  };
}

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
    gl.vertexAttribPointer(a.location, a.components, gl.FLOAT, false, a.stride, a.offset);
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

function create_texture(image, width, height) {
  var image = image || null;
  width = width || canvas.width;
  height = height || canvas.height;
  if (image) {
    image = Uint8Array(image, 0, 0);
  }
  var texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);//this texture is used to store render output for post process.


  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0,
                gl.RGBA, gl.UNSIGNED_BYTE, image);

                console.log(gl.getError());

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

function camera(prog, mat) {
  gl.uniformMatrix4fv(gl.getUniformLocation(prog, "mv_mat"), gl.FALSE, mat);
}

function render_scene(scene) {
  //console.log("render_scene "+scene.name+" "+demo.current_time);
  var td = demo.current_time;
  var ts = td - scene.start_time;
  var tsn = td/scene.duration;

  var t = {
    scene_norm: tsn,
    demo: td,
    scene: ts,
  };

  if (scene.update) {
    console.log("scene.update");
    scene.update(demo.scenes, scene, t);
  }
  for (var p in scene.passes) {
    var pass = scene.passes[p];
    gl.useProgram(pass.program);

    set_basic_uniforms(scene, pass.program);
    if (pass.outputs) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, pass.outputs);
    }
    if (pass.update) {
      pass.update(scene, pass, t);
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
