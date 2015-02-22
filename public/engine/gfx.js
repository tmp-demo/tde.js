var gl
var canvas
var textures = {}
var uniforms = {}
var geometries = {}
var programs = {}
var fragment_shaders = {}
var vertex_shaders = {}
var ctx_2d

var use_texture_float = true;
var gl_ext_half_float;

function gl_init() {
  gl = canvas.getContext("webgl", {alpha: false});
  minify_context(gl);

  gl.getExtension("WEBGL_depth_texture");

  if (use_texture_float) {
    gl_ext_half_float = gl.getExtension("OES_texture_half_float");
    gl.getExtension("OES_texture_half_float_linear");
    gl.getExtension("EXT_color_buffer_half_float");
    minify_context(gl_ext_half_float);
  }

  gl.viewport(0, 0, canvas.width, canvas.height);

  // get readable strings for error enum values
  // #debug{{
  for (var propertyName in gl) {
    if (typeof gl[propertyName] == 'number') {
      _enums[gl[propertyName]] = propertyName;
    }
  }
  // #debug}}

  canvas_2d = document.createElement("canvas");
  canvas_2d.width = canvas_2d.height = 2048;
  ctx_2d = canvas_2d.getContext("2d");
  minify_context(ctx_2d);
}

var _enums = _enums = { }; // #debug

var _locations = [
  "a_position",
  "a_uv",
  "a_normal",
  "a_color",
  "a_triangle_id"
];

var POS = 0;
var UV = 1;
var NORMAL = 2;
var COLOR = 3;
var TRIANGLE_ID = 4;

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
  uniforms["cam_tilt"] = 0
  
  // hack to make the export toolchain minify attribute and uniform names
  // #debug{{
  var fakeContext = {}
  for (var i in _locations) fakeContext["shader_" + _locations[i]] = 42;
  for (var i in _uniforms) fakeContext["shader_" + _uniforms[i]] = 42;
  minify_context(fakeContext);
  // #debug}}

  // edition placeholders
  // #debug{{
  gfx_placeholders_init();
  // #debug}}
}

function make_vbo(location, buffer) {
  var vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buffer), gl.STATIC_DRAW);
  return {location: location, vbo: vbo, length: buffer.length};
}

// editor only
// #debug{{
function destroy_geom(geom) {
  for (var i in geom.buffers) {
    var buffer = geom.buffers[i];
    gl.deleteBuffer(buffer.vbo);
  }
}
// #debug}}

// actually renders
function draw_geom(data) {
  for (var i in data.buffers) {
    var buffer = data.buffers[i];
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vbo);
    gl.enableVertexAttribArray(buffer.location);
    gl.vertexAttribPointer(buffer.location, buffer.length / data.vertex_count, gl.FLOAT, false, 0, 0);
  }
  gl.drawArrays(data.mode, 0, data.vertex_count);
}

// type: gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
function compile_shader(txt_src, type) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, txt_src);
  gl.compileShader(shader);
  // #debug{{
  if ( !gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader), txt_src);
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
    console.error(gl.getProgramInfoLog(program), "Program link error");
  }
  // #debug}}
  return program;
}

// #debug{{
function load_program_from_source(vs_source, fs_source)
{
  var program = gl.createProgram();
  gl.attachShader(program, compile_shader(vs_source, gl.VERTEX_SHADER));
  gl.attachShader(program, compile_shader(fs_source, gl.FRAGMENT_SHADER));

  for (var i in _locations) {
    gl.bindAttribLocation(program, i, _locations[i]);
  }

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program), "Program link error");
  }

  return program;
}

function destroy_shader_program(name)
{
  var program = programs[name]
  if (program) {
    gl.deleteProgram(program)
    delete programs[name]
  }
}
// #debug}}

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

function create_texture(width, height, format, data, allow_repeat, linear_filtering, mipmaps, float_tex) {
  format = format || gl.RGBA;
  width = width || canvas.width;
  height = height || canvas.height;

  var texture = gl.createTexture();

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0,
                format,
                float_tex ? use_texture_float && gl_ext_half_float.HALF_FLOAT_OES
                          : (format == gl.DEPTH_COMPONENT) ? gl.UNSIGNED_SHORT
                                                           : gl.UNSIGNED_BYTE,
                data ? new Uint8Array(data, 0, 0) : null);

  (format == gl.DEPTH_COMPONENT) || set_texture_flags(texture, allow_repeat, linear_filtering, mipmaps);
  //debug{{
  if (float_tex && data) {
    // wouldn't be hard to add, but we haven't needed it yet.
    console.log("!!! We don't support uploading data to float textures, something may be busted.");
  }
  //debug}}

  return {
    tex: texture,
    width: width,
    height: height
  };
}

function destroy_texture(texture) {
  gl.deleteTexture(texture.tex);
}

function texture_unit(i) { return gl.TEXTURE0+i; }

function frame_buffer(target) {
  var fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

  if (target.color && textures[target.color]) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures[target.color].tex, 0);
  if (target.depth && textures[target.depth]) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, textures[target.depth].tex, 0);

  // #debug{{
  var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status != gl.FRAMEBUFFER_COMPLETE) {
    console.error(frame_buffer_error(status), "Incomplete framebuffer");
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
  //mat4.lookAt(viewMatrix, uniforms["cam_pos"], uniforms["cam_target"], [0.0, 1.0, 0.0]);
  mat4.lookAtTilt(viewMatrix, uniforms["cam_pos"], uniforms["cam_target"], uniforms["cam_tilt"]);
  mat4.perspective(projectionMatrix, uniforms["cam_fov"] * M.PI / 180.0, ratio, 2.0, 10000.0)
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
      case 9: gl.uniformMatrix3fv(location, 0, val); break;
      case 16: gl.uniformMatrix4fv(location, 0, val); break;
    }
  }
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
  gl.disable(gl.BLEND);
  for (var p in scene.passes) {
    var pass = scene.passes[p];

    var texture_inputs = [];
    if (pass.texture_inputs) {
      for (var i=0; i<pass.texture_inputs.length; ++i) {
        texture_inputs.push(textures[pass.texture_inputs[i]]);
      }
    }

    if (pass.update) {
      pass.update(t, texture_inputs);
    }

    var program = programs[pass.program]
    //#debug{{
    if (!program) {
      if (pass.program) {
        console.log("Missing program "+pass.program+" (using placeholder)");
      }
      program = program_placeholder
    }
    //#debug}}
    if (!program)
      return;
    var shader_program = program;
    gl.useProgram(shader_program);
    var rx = canvas.width;
    var ry = canvas.height;
    if (pass.render_to) {
      rx = textures[pass.render_to.color].width;
      ry = textures[pass.render_to.color].height;
    }
    uniforms["u_resolution"] = [rx,ry];
    set_uniforms(shader_program, rx / ry);
    gl.viewport(0, 0, rx, ry);

    gl.bindFramebuffer(gl.FRAMEBUFFER, pass.fbo);
    
    for (var i=0; i<texture_inputs.length; ++i) {
      //#debug{{
      if (!texture_inputs[i]) {
        // TODO: should use a placeholder texture or something.
        // This can happen in the editor if a frame is rendered
        // while a texture is not loaded yet.
        console.log("render_scene: missing texture "+pass.texture_inputs[i]);
        return;
      }
      //#debug}}
      var tex = texture_inputs[i].tex;
      gl.activeTexture(texture_unit(i));
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(gl.getUniformLocation(shader_program,"texture_"+i), i);
    }

    if (pass.blend) {
      gl.enable(gl.BLEND);
      gl.blendFunc.apply(gl, pass.blend);
    }
    
    if (pass.depth_test) {
      gl.enable(gl.DEPTH_TEST);
    }
    else {
      gl.disable(gl.DEPTH_TEST);
    }
    
    if (pass.clear) {
      gl.clearColor(pass.clear[0], pass.clear[1], pass.clear[2], pass.clear[3]);
      gl.clearDepth(1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
    
    if (pass.geometry) {
      var geometry = geometries[pass.geometry]
      //#debug{{
      if (!geometry) {
        console.log("Missing geometry "+pass.geometry+" (using placeholder)");
        geometry = geometry_placeholder
      }
      //#debug}}

      draw_geom(geometry)
    }
  }
}
