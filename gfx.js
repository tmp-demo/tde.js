
function gl_init() {
  document.firstChild.remove();
  var c = document.createElement("canvas");
  document.body.appendChild(c);
  c.id = "renderer";
  gl = c.getContext("experimental-webgl");
  c.width = demo.w;
  c.height = demo.h;

  gl.viewport(0, 0, demo.w, demo.h);
  ext = {
    draw_buffers: gl.getExtension("WEBGL_draw_buffers"),
    depth_textures: gl.getExtension("WEBGL_depth_texture")
  };
  // #debug{{
  if (!ext.draw_buffers) {
    alert("WEBGL_draw_buffers not supported :(");
  }
  if (!ext.depth_textures) {
    alert("WEBGL_depth_texture not supported :(");
  }
  // #debug}}

  var buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  var quad = new Float32Array([-1, -1,
                               -1,  1,
                                1, -1,
                                1,  1]);
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
  _quad_vbo = buffer;
  // get readable strings for error enum values
  // #debug{{
  for (var propertyName in gl) {
    if (typeof gl[propertyName] == 'number') {
      _enums[gl[propertyName]] = propertyName;
    }
  }
  // #debug}}
}

_quad_vbo = null;
_enums = _enums = { }; // #debug

_locations = [
  "position",
  "tex_coords",
  "normals",
  "color"
];

POS = 0;
TEX_COORDS = 1;
NORMALS = 2;
COLOR = 3;

// #debug{{
function gl_error() {
  var v = gl.getError();
  var name = _enums[v];
  return (name !== undefined) ? ("gl." + name) :
      ("/*UNKNOWN WebGL ENUM*/ 0x" + v.toString(16) + "");
}
// #debug}}

function gfx_init() {
  // replace the render passes' texture arrays by actual frame buffer objects
  for (var s=0; s<demo.scenes.length; ++s) {
    var scene = demo.scenes[s];
    for (var p=0; p<scene.passes.length; ++p) {
      var pass = scene.passes[p];
      if (pass.render_to) {
        pass.fbo = frame_buffer(pass.render_to);
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
    attribs: attrib_list
  };
}

function draw_quad() {
  gl.disable(gl.DEPTH_TEST);
  gl.bindBuffer(gl.ARRAY_BUFFER, _quad_vbo);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// actually renders
function draw_geom(data) {
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
  // #debug{{
  if ( !gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("Shader compilation failed: " + gl.getShaderInfoLog(shader));
  }
  // #debug}}
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
  // #debug{{
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    alert("Program link error: " +
          gl.getProgramParameter(program, gl.VALIDATE_STATUS) +
          "\nERROR: " + gl_error());
  }
  // #debug}}
  return program;
}

function create_texture(width, height, format, image, allow_repeat) {
  var image = image || null;
  var format = format || gl.RGBA;
  width = width || canvas.width;
  height = height || canvas.height;
  if (image) {
    image = new Uint8Array(image, 0, 0);
  }
  var texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  var wrap = gl.CLAMP_TO_EDGE;
  if (allow_repeat) { wrap = gl.REPEAT; }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0,
                format, gl.UNSIGNED_BYTE, image);
  console.log(gl.getError()); // #debug
  return texture;
}

function create_depth_buffer(w,h) {
  var depth_rb = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depth_rb);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  return depth_rb;
}

function texture_unit(i) { return gl.TEXTURE0+i; }

function color_attachment(i) {
  return ext.draw_buffers["COLOR_ATTACHMENT0_WEBGL"]+i;
}

// #debug{{
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

function frame_buffer(target) {
  var fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  var buffers = [];

  if (target.depth) {
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, target.depth);
  }

  for (var t=0; t<target.color.length;++t) {
    gl.framebufferTexture2D(gl.FRAMEBUFFER, color_attachment(t), gl.TEXTURE_2D, target.color[t], 0);
    buffers.push(ext.draw_buffers["COLOR_ATTACHMENT0_WEBGL"]+t)
  }

  ext.draw_buffers["drawBuffersWEBGL"](buffers);

  // #debug{{
  var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status != gl.FRAMEBUFFER_COMPLETE) {
    alert("incomplete framebuffer "+frame_buffer_error(status));
  }
  // #debug}}
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return fbo;
}

function set_basic_uniforms(scene, program, rx, ry) {
  var current = demo.current_time - scene.start_time;
  //console.log("current_time:"+demo.current_time+" scene time:"+current+" "+"duration:"+scene.duration);
  gl.uniform1f(gl.getUniformLocation(program, 'time'), current);
  gl.uniform1f(gl.getUniformLocation(program, 'duration'), scene.duration);
  gl.uniform2f(gl.getUniformLocation(program, 'resolution'), rx, ry);
  // TODO beat detector
  gl.uniform1f(gl.getUniformLocation(program, 'beat'), 0.0/*bd.beat()*/);
}

function camera(prog, mat) {
  gl.uniformMatrix4fv(gl.getUniformLocation(prog, "mv_mat"), gl.FALSE, mat);
}

function clear() {
  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
}

function render_scene(scene) {
  //console.log("render_scene "+scene.name+" "+demo.current_time);
  var td = demo.current_time;
  var ts = td - scene.start_time;
  var tsn = td/scene.duration;

  var t = {
    scene_norm: tsn,
    demo: td,
    scene: ts
  };
  if (scene.update) {
    console.log("scene.update");
    scene.update(demo.scenes, scene, t);
  }
  for (var p in scene.passes) {
    var pass = scene.passes[p];
    if (pass.program) {
      gl.useProgram(pass.program);
      var rx = canvas.width;
      var ry = canvas.height;
      if (pass.render_to) {
        rx = pass.render_to.w || rx;
        ry = pass.render_to.h || ry;
      }
      set_basic_uniforms(scene, pass.program, rx, ry);
      gl.viewport(0, 0, rx, ry);
    }
    if (pass.fbo) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, pass.fbo);
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
