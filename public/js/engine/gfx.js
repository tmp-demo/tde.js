
var textures = {}
var uniforms = {}
var geometries = {}
var programs = {}
var fragment_shaders = {}
var vertex_shaders = {}

var GL_TEXTURE_2D;
var GL_ARRAY_BUFFER;
var GL_STATIC_DRAW;
var GL_ELEMENT_ARRAY_BUFFER;

function gl_init() {
  gl = canvas.getContext("experimental-webgl");
  gl.viewport(0, 0, demo.w, demo.h);
  ext = {
    draw_buffers: gl.getExtension("WEBGL_draw_buffers")
  };
  // #debug{{
  if (!ext.draw_buffers) {
    console.log("WEBGL_draw_buffers not supported :( parts of the demo will not render properly");
  }
  // #debug}}

  // put some commonly used gl constants behind variable names that can be
  // minified.
  GL_TEXTURE_2D = gl.TEXTURE_2D;
  GL_ARRAY_BUFFER = gl.ARRAY_BUFFER;
  GL_STATIC_DRAW = gl.STATIC_DRAW;
  GL_ELEMENT_ARRAY_BUFFER = gl.ELEMENT_ARRAY_BUFFER;


  var buffer = gl.createBuffer();
  gl.bindBuffer(GL_ARRAY_BUFFER, buffer);
  var quad = new Float32Array([-1, -1,
                               -1,  1,
                                1, -1,
                                1,  1]);
  gl.bufferData(GL_ARRAY_BUFFER, quad, GL_STATIC_DRAW);
  _quad_vbo = buffer;
  // get readable strings for error enum values
  // #debug{{
  for (var propertyName in gl) {
    if (typeof gl[propertyName] == 'number') {
      _enums[gl[propertyName]] = propertyName;
    }
  }
  // #debug}}

  load_shaders();
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
  // this is far from optimal...
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

function upload_geom(geom) {
  gl.bindBuffer(GL_ARRAY_BUFFER, geom.vbo);
  gl.bufferData(GL_ARRAY_BUFFER, geom.src.vertices, GL_STATIC_DRAW);
  gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, geom.ibo);
  gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, geom.src.indices, GL_STATIC_DRAW);
}

function create_geom(vertices, indices, comp_per_vertex, attrib_list) {
  var geom = {
    src: {
      vertices: new Float32Array(vertices),
      indices: new Uint16Array(indices)
    },
    vbo: gl.createBuffer(),
    ibo: gl.createBuffer(),
    num_indices: indices.length,
    components_per_vertex: comp_per_vertex,
    attribs: attrib_list
  };
  upload_geom(geom);
  return geom;
}

function draw_quad() {
  gl.disable(gl.DEPTH_TEST);
  gl.bindBuffer(GL_ARRAY_BUFFER, _quad_vbo);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// actually renders
function draw_geom(data) {
  gl.enable(gl.DEPTH_TEST);
  gl.bindBuffer(GL_ARRAY_BUFFER, data.vbo);
  for (var c = 0; c < data.attribs.length;++c) {
    gl.enableVertexAttribArray(c);
    var a = data.attribs[c];
    gl.vertexAttribPointer(a.location, a.components, gl.FLOAT, false, a.stride, a.offset);
  }
  gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER, data.ibo);
  gl.drawElements(gl.TRIANGLES, data.num_indices, gl.UNSIGNED_SHORT, 0);
}

// to use with the timeline
function draw_mesh(data) {
  return function(prog) {
    draw_geom(data, prog);
  }
}

// type: gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
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

function load_shader_program(vs_entry_point, fs_entry_point) {
  var vs = vs_shader_source.replace(vs_entry_point + "()", "main()");
  var fs = fs_shader_source.replace(fs_entry_point + "()", "main()");
  var program = gl.createProgram();
  gl.attachShader(program, compile_shader(vs, gl.VERTEX_SHADER));
  gl.attachShader(program, compile_shader(fs, gl.FRAGMENT_SHADER));
  
  for (var i in _locations) {
    gl.bindAttribLocation(program, i, _locations[i]);
  }
  
  gl.linkProgram(program);
  // #debug{{
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    alert("Program link error: " + gl.getProgramInfoLog(program));
  }
  // #debug}}
  return program;
}

function create_texture(width, height, format, image, allow_repeat) {
  var image = image || null;
  var format = format || gl.RGBA;
  width = width || demo.w;
  height = height || demo.h;
  if (image) {
    image = new Uint8Array(image, 0, 0);
  }
  var texture = gl.createTexture();
  gl.bindTexture(GL_TEXTURE_2D, texture);

  var wrap = gl.CLAMP_TO_EDGE;
  if (allow_repeat) { wrap = gl.REPEAT; }

  gl.texParameteri(GL_TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(GL_TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  gl.texParameteri(GL_TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(GL_TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(GL_TEXTURE_2D, 0, format, width, height, 0,
                format, gl.UNSIGNED_BYTE, image);
  return { tex: texture, width: width, height: height };
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
  // #debug{{
  if (!ext.draw_buffers) {
    return gl.COLOR_ATTACHMENT0+i;
  }
  // #debug}}
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

  // this branch is *always* taken in release builds
  if (ext.draw_buffers) { // #debug

    for (var t=0; t<target.color.length;++t) {
      gl.framebufferTexture2D(gl.FRAMEBUFFER, color_attachment(t),
                              GL_TEXTURE_2D, target.color[t].tex, 0);
      buffers.push(ext.draw_buffers["COLOR_ATTACHMENT0_WEBGL"]+t)
    }
    ext.draw_buffers["drawBuffersWEBGL"](buffers);

  // #debug{{
  } else if (target.color.length > 0) {
      gl.framebufferTexture2D(gl.FRAMEBUFFER, color_attachment(0),
                              GL_TEXTURE_2D, target.color[0].tex, 0);
  }
  var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status != gl.FRAMEBUFFER_COMPLETE) {
    alert("incomplete framebuffer "+frame_buffer_error(status));
  }
  // #debug}}
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return fbo;
}

function set_uniforms(program) {
  for (var uniformName in uniforms) {
    var val = uniforms[uniformName];

    var location = gl.getUniformLocation(program, uniformName);
    if (location == -1)
      continue;
 
    // if val is a bare number, make a one-element array
    if (typeof val == "number")
      val = [val];

    switch (val.length) {
      case 1: gl.uniform1fv(location, val); break;
      case 2: gl.uniform2fv(location, val); break;
      case 3: gl.uniform3fv(location, val); break;
      case 4: gl.uniform4fv(location, val); break;
      case 9: gl.uniformMatrix3fv(location, gl.FALSE, val); break;
      case 16: gl.uniformMatrix4fv(location, gl.FALSE, val); break;
    }
  }
}

function clear() {
  gl.clearColor(1.0, 1.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
}

function render_scene(scene, demo_time, scene_time) {
  var tsn = scene_time/scene.duration;
  uniforms["demo_time"] = demo_time;
  uniforms["clip_time"] = scene_time;
  uniforms["clip_time_norm"] = tsn;
  uniforms["clip_duration"] = scene.duration;
  var t = {
    scene_norm: tsn,
    demo: demo_time,
    scene: scene_time
  };
  if (scene.update) {
    scene.update(demo.scenes, scene, t);
  }
  for (var p in scene.passes) {
    var pass = scene.passes[p];
    if (pass.program) {
      var shader_program = pass.program;
      gl.useProgram(shader_program);
      var rx = demo.w;
      var ry = demo.h;
      if (pass.render_to) {
        rx = pass.render_to.w || rx;
        ry = pass.render_to.h || ry;
      }
      uniforms["resolution"] = [rx,ry];
      set_uniforms(shader_program);
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
        var tex = pass.texture_inputs[i].tex;
        gl.activeTexture(texture_unit(i));
        gl.bindTexture(GL_TEXTURE_2D, tex);
        gl.uniform1i(gl.getUniformLocation(shader_program,"texture_"+i), i);
      }
    }
    pass.render(pass.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}
