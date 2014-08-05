var gl
var canvas
var textures = {}
var uniforms = {}
var geometries = {}
var programs = {}
var fragment_shaders = {}
var vertex_shaders = {}
var textureCanvas
var textureContext

function gl_init() {
  gl = canvas.getContext("webgl");
  minify_context(gl);
  
  gl.viewport(0, 0, canvas.width, canvas.height);

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

  textureCanvas = document.createElement("canvas");
  textureContext = textureCanvas.getContext("2d");
  minify_context(textureContext);
  
  load_shaders();
}

var _quad_vbo = null;
var _enums = _enums = { }; // #debug

var _locations = [
  "position",
  "tex_coords",
  "normals",
  "color"
];

var POS = 0;
var TEX_COORDS = 1;
var NORMALS = 2;
var COLOR = 3;

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
  for (var s=0; s<scenes.length; ++s) {
    var scene = scenes[s];
    for (var p=0; p<scene.passes.length; ++p) {
      var pass = scene.passes[p];
      if (pass.render_to) {
        pass.fbo = frame_buffer(pass.render_to);
      }
    }
  }
  
  uniforms["cam_pos"] = [0, 1, 0]
  uniforms["cam_target"] = [0, 0, 0]
  uniforms["cam_fov"] = 75
}

function make_vbo(location, buffer) {
  var vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buffer), gl.STATIC_DRAW);
  return {location: location, vbo: vbo, length: buffer.length};
}

// editor only
// #debug{{
function replace_geom(old_geom, new_geom) {
  gl.deleteBuffer(old_geom.vbo);
  gl.deleteBuffer(old_geom.ibo);
  old_geom.src = new_geom.src;
  old_geom.vbo = new_geom.vbo;
  old_geom.ibo = new_geom.ibo;
  old_geom.num_indices = new_geom.num_indices;
  old_geom.components_per_vertex = new_geom.components_per_vertex;
  old_geom.attribs = new_geom.attribs;
}
// #debug}}

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
  for (var i in data.buffers) {
    var buffer = data.buffers[i];
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vbo);
    gl.enableVertexAttribArray(buffer.location);
    gl.vertexAttribPointer(buffer.location, buffer.length / data.vertex_count, gl.FLOAT, false, 0, 0);
  }
  gl.drawArrays(data.mode, 0, data.vertex_count);
}

// to use with the timeline
function draw_mesh(data) {
  return function() {
    draw_geom(data);
  }
}

// type: gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
function compile_shader(txt_src, type) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, txt_src);
  gl.compileShader(shader);
  // #debug{{
  if ( !gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    toastr.error(gl.getShaderInfoLog(shader), "Shader compilation failed");
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
    toastr.error(gl.getProgramInfoLog(program), "Program link error");
  }
  // #debug}}
  return program;
}

function set_texture_flags(texture, allow_repeat, linear_filtering, mipmaps) {
  // XXX - Getting the following error associated to the bind texture call:
  // WebGL: A texture is going to be rendered as if it were black, as per the
  // OpenGL ES 2.0.24 spec section 3.8.2, because it is a 2D texture, with a
  // minification filter requiring a mipmap, and is not mipmap complete (as
  // defined in section 3.7.10).
  gl.bindTexture(gl.TEXTURE_2D, texture);

  var wrap = allow_repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  var min_filtering = linear_filtering
                    ? mipmaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR
                    : gl.NEAREST;
  var mag_filtering = linear_filtering ? gl.LINEAR : gl.NEAREST;

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, min_filtering);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mag_filtering);
  if (mipmaps) {
    gl.generateMipmap(gl.TEXTURE_2D);
  }
}

function create_texture(width, height, format, data, allow_repeat, linear_filtering, mipmaps) {
  format = format || gl.RGBA;
  width = width || canvas.width;
  height = height || canvas.height;

  var texture = gl.createTexture();

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0,
                format,
                (format == gl.DEPTH_COMPONENT) ? gl.UNSIGNED_SHORT
                                               : gl.UNSIGNED_BYTE, data ? new Uint8Array(data, 0, 0)
                                                                        : null);

  set_texture_flags(texture, allow_repeat, linear_filtering, mipmaps);

  return {
    tex: texture,
    width: width,
    height: height,
    format: format
  };
}

function update_texture(desc, data) {
  gl.bindTexture(gl.TEXTURE_2D, desc.tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, desc.format, desc.width, desc.height, 0,
                desc.format, (desc.format == gl.DEPTH_COMPONENT) ? gl.UNSIGNED_SHORT : gl.UNSIGNED_BYTE, new Uint8Array(data, 0, 0));
}

function create_text_texture(text, fontSize, badgeDiameter) {
  textureCanvas.width = textureCanvas.height = 2048;
  textureContext.font = fontSize + "px OCR A STD";

  var width = 1 + textureContext.measureText(text).width|0
    height = fontSize * 1.25,
    x = 2,
    y = - fontSize / 4;

  if (badgeDiameter) {
    var gradient = textureContext.createLinearGradient(0, 0, badgeDiameter, badgeDiameter);
    gradient.addColorStop(0, "#7bf");
    gradient.addColorStop(1, "#579");
    textureContext.fillStyle = gradient;
    textureContext.moveTo(badgeDiameter, badgeDiameter / 2);
    for (var i = 1; i < 49; ++i) {
      var radius = (i % 2) ? badgeDiameter * 0.4 : badgeDiameter / 2;
      textureContext.lineTo(badgeDiameter / 2 + radius * M.cos(i / 24 * M.PI), badgeDiameter / 2 + radius * M.sin(i / 24 * M.PI));
    }
    textureContext.fill();
    
    textureContext.globalCompositeOperation = 'destination-out';
    textureContext.moveTo(badgeDiameter * 0.85, badgeDiameter / 2);
    textureContext.arc(badgeDiameter / 2, badgeDiameter / 2, badgeDiameter * 0.35, M.PI*2, false);
    textureContext.lineWidth = badgeDiameter / 2 * 0.05;
    textureContext.stroke();
    textureContext.globalCompositeOperation = 'source-over';
    x = (badgeDiameter - width)/2;
    y = badgeDiameter / 2 - y;
    height = width = badgeDiameter;
  }
  
  textureContext.fillStyle = "#fff";
  textureContext.fillText(text, x, y);
  
  return create_texture(width, height, gl.RGBA, textureContext.getImageData(0, 0, width, height).data, false, true);
}

function create_dev_tool() {
  var width = textureCanvas.width = 2048;
  var height = textureCanvas.height = 1024;
  
  textureContext.fillStyle = '#222';
  textureContext.fillRect(0, 700, width, height);
  
  textureContext.fillStyle = '#fff';
  textureContext.fillRect(2, 740, width - 4, height);
  
  textureContext.font = 30 + "px OCR A STD";
  textureContext.fillText("Elements  Network  Sources  Timeline  Profiles  Console", 40, 730);
  
  textureContext.font = 40 + "px Courier";
  textureContext.fillStyle = '#f11';
  textureContext.fillText("TypeError: undefined is not a function", 20, 780);
  
  return create_texture(width, height, gl.RGBA, textureContext.getImageData(0, 0, width, height).data, false, true);
}

function texture_unit(i) { return gl.TEXTURE0+i; }

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

  if (target.color) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.color.tex, 0);
  if (target.depth) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, target.depth.tex, 0);

  // #debug{{
  var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status != gl.FRAMEBUFFER_COMPLETE) {
    toastr.error(frame_buffer_error(status), "Incomplete framebuffer");
  }
  // #debug}}

  return fbo;
}

function set_uniforms(program, ratio) {
  var viewMatrix = mat4.create()
  var projectionMatrix = mat4.create()
  var viewProjectionMatrix = mat4.create()
  var viewProjectionMatrixInv = mat4.create()
  
  // derive camera matrices from simpler parameters
  mat4.lookAt(viewMatrix, uniforms["cam_pos"], uniforms["cam_target"], [0.0, 1.0, 0.0]);
  mat4.perspective(projectionMatrix, uniforms["cam_fov"] * M.PI / 180.0, ratio, 1.0, 1000.0)
  mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
  mat4.invert(viewProjectionMatrixInv, viewProjectionMatrix);
  uniforms["view_proj_mat"] = viewProjectionMatrix;
  uniforms["view_proj_mat_inv"] = viewProjectionMatrixInv;
  
  for (var uniformName in uniforms) {
    var val = uniforms[uniformName];

    var location = gl.getUniformLocation(program, uniformName);
    if (!location)
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
  gl.clearColor(0.7, 0.8, 0.9, 1.0);
  gl.clearDepth(1.0);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
}

function render_scene(scene, demo_time, scene_time) {
  var clip_time_norm = scene_time/scene.duration;
  uniforms["clip_time"] = scene_time;
  var t = {
    scene_norm: clip_time_norm,
    demo: demo_time,
    scene: scene_time
  };
  if (scene.update) {
    scene.update(t);
  }
  for (var p in scene.passes) {
    var pass = scene.passes[p];
    if (pass.update) {
      pass.update(t);
    }
    if (pass.program) {
      var shader_program = pass.program;
      gl.useProgram(shader_program);
      var rx = canvas.width;
      var ry = canvas.height;
      if (pass.render_to) {
        rx = pass.render_to.color.width;
        ry = pass.render_to.color.height;
      }
      uniforms["resolution"] = [rx,ry];
      set_uniforms(shader_program, rx / ry);
      gl.viewport(0, 0, rx, ry);
    }
    if (pass.fbo) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, pass.fbo);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    if (pass.texture_inputs) {
      for (var i=0; i<pass.texture_inputs.length; ++i) {
        var tex = pass.texture_inputs[i].tex;
        gl.activeTexture(texture_unit(i));
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.uniform1i(gl.getUniformLocation(shader_program,"texture_"+i), i);
      }
    }
    if (pass.blend) {
      gl.enable(gl.BLEND);
      gl.blendFunc.apply(gl, pass.blend);
    }
    if (pass.render) {
      pass.render(pass.program);
    }
    if (pass.blend)
      gl.disable(gl.BLEND);
  }
}
