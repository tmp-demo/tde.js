var gl
var canvas
var textures = {}
var uniforms = {}
var geometries = {}
var scenes = {}
var programs = {}
var fragment_shaders = {}
var vertex_shaders = {}
var ctx_2d

var use_texture_float = false;
var gl_ext_half_float;

// #debug{{
var uniform_editor_overrides = {}
// #debug}}

function gl_init() {
  gl = canvas.getContext("webgl", {alpha: false});
  //minify_context(gl);

  var depthTextureExtension = gl.getExtension("WEBGL_depth_texture");
  // #debug{{
  if (!depthTextureExtension) {
    alert("Failed to load WEBGL_depth_texture");
  }
  // #debug}}

  if (use_texture_float) {
    gl_ext_half_float = gl.getExtension("OES_texture_half_float");
    gl.getExtension("OES_texture_half_float_linear");
    gl.getExtension("EXT_color_buffer_half_float");
    //minify_context(gl_ext_half_float);
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
  //minify_context(ctx_2d);
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

  init_render_to_texture(sequence);

  uniforms["cam_pos"] = [0, 1, 0]
  uniforms["cam_target"] = [0, 0, 0]
  uniforms["cam_fov"] = 75
  uniforms["cam_tilt"] = 0

  // hack to make the export toolchain minify attribute and uniform names
  // #debug{{
  var fakeContext = {}
  for (var i in _locations) fakeContext["shader_" + _locations[i]] = 42;
  for (var i in _uniforms) fakeContext["shader_" + _uniforms[i]] = 42;
  //minify_context(fakeContext);
  // #debug}}

  init_placeholders();
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

function create_texture(width, height, format, data, allow_repeat, linear_filtering, mipmaps, float_tex) {
  //debug{{
  if (float_tex && data) {
    // wouldn't be hard to add, but we haven't needed it yet.
    console.log("!!! We don't support uploading data to float textures, something may be busted.");
  }

  if ((format == gl.DEPTH_COMPONENT) && (linear_filtering || mipmaps || float_tex)) {
    // bug somewhere
    console.log("!!! Creating a depth texture with broken parameters, it won't work.");
  }
  //debug}}

  var format = format || gl.RGBA;
  var width = width || canvas.width;
  var height = height || canvas.height;

  var wrap = allow_repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  var min_filtering = linear_filtering
                    ? mipmaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR
                    : gl.NEAREST;
  var mag_filtering = linear_filtering ? gl.LINEAR : gl.NEAREST;

  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, min_filtering);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mag_filtering);
  gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0,
                format,
                (use_texture_float && float_tex) ? gl_ext_half_float.HALF_FLOAT_OES
                          : (format == gl.DEPTH_COMPONENT) ? gl.UNSIGNED_SHORT
                                                           : gl.UNSIGNED_BYTE,
                data ? new Uint8Array(data, 0, 0) : null);

  gl.bindTexture(gl.TEXTURE_2D, null);

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

function send_uniforms(program, uniform_list, t) {
  if (!uniform_list || !program) {
    return;
  }

  for (var uniform_name in uniform_list) {
    var val = uniform_list[uniform_name];

    var location = gl.getUniformLocation(program, uniform_name);

    if (!location) {
      continue;
    }

    if (typeof val == "string") {
      val = eval("_="+val);
    }

    if (typeof val == "function") {
      val = val(t);
    }

    // if val is a bare number, make a one-element array
    if (typeof val == "number") {
      val = [val];
    }

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

function set_uniforms(program, ratio, t) {

  // allow the editor to override uniforms for debug
  // #debug{{
  for (var uniform_name in uniforms) {
    uniforms[uniform_name] = uniform_editor_overrides.hasOwnProperty(uniform_name) ? uniform_editor_overrides[uniform_name] : uniforms[uniform_name]
  }
  // #debug}}

  var viewMatrix = mat4.create()
  var projectionMatrix = mat4.create()
  var viewProjectionMatrix = mat4.create()
  //var viewProjectionMatrixInv = mat4.create()
  
  // derive camera matrices from simpler parameters
  //mat4.lookAt(viewMatrix, uniforms["cam_pos"], uniforms["cam_target"], [0.0, 1.0, 0.0]);
  mat4.lookAtTilt(viewMatrix, uniforms["cam_pos"], uniforms["cam_target"], uniforms["cam_tilt"]);
  mat4.perspective(projectionMatrix, uniforms["cam_fov"] * M.PI / 180.0, ratio, 2.0, 10000.0)
  mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
  //mat4.invert(viewProjectionMatrixInv, viewProjectionMatrix);
  uniforms["view_proj_mat"] = viewProjectionMatrix;
  //uniforms["view_proj_mat_inv"] = viewProjectionMatrixInv;

  send_uniforms(program, uniforms, t);
}

function render_pass(pass, time) {
  for (var j = 0; j < pass.clips.length; j++) {
    var clip = pass.clips[j]

    var clip_time = time - clip.start
    if ((clip_time >= 0) && (clip_time < clip.duration)) {
      // if needed, clip_time_norm = clip_time / clip.duration
      uniforms["clip_time"] = clip_time;

      // uniform animation
      if (clip.uniforms) {
        for (var uniform_name in clip.uniforms) {
          uniforms[uniform_name] = animate(deep_clone(clip.uniforms[uniform_name]), clip_time)
        }
      }

      // actual render

      var resolution = prepare_render_to_texture(pass);

      preapre_clear(pass);

      var shader_program = get_shader_program(pass);
      if (!shader_program) {
        continue;
      }

      gl.useProgram(shader_program);

      gl.viewport(0, 0, resolution[0], resolution[1]);

      set_uniforms(shader_program, resolution[0] / resolution[1], clip_time);

      prepare_texture_inputs(pass, shader_program);

      prepare_blending(pass);

      prepare_depth_test(pass);

      render(pass, shader_program, clip_time);

      cleanup_render_to_texture(pass);

      cleanup_texture_inputs(pass);
    }
  }
}

function render_sequence(sequence, time) {
  /*for (var i = 0; i < sequence.length; i++) {
    render_pass(sequence[i], time)
  }*/
  sequence.map(function(pass) {
    render_pass(pass, time)
  })
}
