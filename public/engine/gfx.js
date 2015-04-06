
// The placeholders code has multiline strings that closure don't like
// so we can't enable it in the export for now.

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

var gl_ext_half_float;

if (config.EDITOR) {
  var uniform_editor_overrides = {}
}

function gl_init() {
  gl = canvas.getContext("webgl", {alpha: false});
  //minify_context(gl);

  if (config.GL_DEBUG) {
    function logGLCall(functionName, args) {
      if (config.GL_DEBUG_TRACE) {
        console.log("gl." + functionName + "(" + WebGLDebugUtils["glFunctionArgsToString"](functionName, args) + ")");
      }
    }
    gl = WebGLDebugUtils["makeDebugContext"](gl, undefined, logGLCall);
  }

  if (config.DEPTH_TEXTURE_ENABLED) {
    var depthTextureExtension = gl.getExtension("WEBGL_depth_texture");
    if (config.GL_DEBUG) {
      if (!depthTextureExtension) {
        alert("Failed to load WEBGL_depth_texture");
      }
    }
  }

  if (config.TEXTURE_FLOAT_ENABLED) {
    gl_ext_half_float = gl.getExtension("OES_texture_half_float");
    gl.getExtension("OES_texture_half_float_linear");
    gl.getExtension("EXT_color_buffer_half_float");
    //minify_context(gl_ext_half_float);
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
}

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

  if (config.CAM_UNIFORMS_ENABLED) {
    uniforms["cam_pos"] = [0, 1, 0]
    uniforms["cam_target"] = [0, 0, 0]
    uniforms["cam_fov"] = 75
    uniforms["cam_tilt"] = 0
  }

  // hack to make the export toolchain minify attribute and uniform names
  if (config.EDITOR) {
    var _uniforms = [
      "cam_pos",
      "world_mat",
      "view_proj_mat",
      "view_proj_mat_inv",
      "resolution",
      "focus",
      "light",
      /*"texture_0",
      "texture_1",
      "texture_2",
      "texture_3",
      "texture_4",*/
      "text_params",
      "mask",
      "cam_target",
      "cam_fov",
      "glitch"
    ];

    var fakeContext = {}
    for (var i in _locations) fakeContext["shader_" + _locations[i]] = 42;
    for (var i in _uniforms) fakeContext["shader_" + _uniforms[i]] = 42;
    //minify_context(fakeContext);
  }

  if (config.EDITOR) {
    init_placeholders();
  }
}

function make_vbo(location, buffer) {
  var vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(buffer), gl.STATIC_DRAW);
  return {location: location, vbo: vbo, length: buffer.length};
}

// editor only (will be stripped)
function destroy_geom(geom) {
  for (var i in geom.buffers) {
    var buffer = geom.buffers[i];
    gl.deleteBuffer(buffer.vbo);
  }
}

// actually renders
function draw_geom(data, instance_count, instance_id_location) {
  for (var i in data.buffers) {
    var buffer = data.buffers[i];
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vbo);
    gl.enableVertexAttribArray(buffer.location);
    gl.vertexAttribPointer(buffer.location, buffer.length / data.vertex_count, gl.FLOAT, false, 0, 0);
  }

  instance_count = instance_count || 1;
  for (var i = 0; i < instance_count; i++) {
    gl.uniform1f(instance_id_location, i);
    gl.drawArrays(data.mode, 0, data.vertex_count);
  }
}

// type: gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
function compile_shader(txt_src, type) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, txt_src);
  gl.compileShader(shader);
  if (config.GL_DEBUG) {
    if ( !gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader), txt_src);
    }
  }
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
  if (config.GL_DEBUG) {
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program), "Program link error");
    }
  }
  return program;
}

// editor support
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

// editor support
function destroy_shader_program(name)
{
  var program = programs[name]
  if (program) {
    gl.deleteProgram(program)
    delete programs[name]
  }
  if (!config.EDITOR) {
    console.log("function destroy_shader_program should not be exported!");
  }
}

function send_uniforms(program, uniform_list) {
  if (!uniform_list || !program) {
    return;
  }

  for (var uniform_name in uniform_list) {
    var location = gl.getUniformLocation(program, uniform_name);

    if (!location) {
      continue;
    }

    var val = uniform_list[uniform_name];

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

function set_uniforms(program, ratio) {

  // allow the editor to override uniforms for debug
  if (config.EDITOR) {
    for (var uniform_name in uniforms) {
      uniforms[uniform_name] = uniform_editor_overrides.hasOwnProperty(uniform_name) ? uniform_editor_overrides[uniform_name]
                                                                                     : uniforms[uniform_name]
    }
  }

  if (config.CAM_UNIFORMS_ENABLED) {
    var viewMatrix = mat4.create()
    var projectionMatrix = mat4.create0() // careful: 0 here
    var viewProjectionMatrix = mat4.create0()
    //var viewProjectionMatrixInv = mat4.create()
    // derive camera matrices from simpler parameters
    //mat4.lookAt(viewMatrix, uniforms["cam_pos"], uniforms["cam_target"], [0.0, 1.0, 0.0]);
    mat4.lookAtTilt(viewMatrix, uniforms["cam_pos"], uniforms["cam_target"], uniforms["cam_tilt"]);
    mat4.perspective(projectionMatrix, uniforms["cam_fov"] * Math.PI / 180.0, ratio, 2.0, 10000.0)
    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
    //mat4.invert(viewProjectionMatrixInv, viewProjectionMatrix);
    uniforms["view_proj_mat"] = viewProjectionMatrix;
    //uniforms["view_proj_mat_inv"] = viewProjectionMatrixInv;
  }

  send_uniforms(program, uniforms);
}

function resolve_animation_clip(clip, time) {
  var clip_time = time - clip.start;
  is_active = (clip_time >= 0 && clip_time <= clip.duration);
  if (is_active) {
    var anim = clip.animation;
    // Careful here: if anim is set to zero, it'll mean that the tract is
    // inactive which may not be the intension. use [0] if you want to inline
    // constants.
    // TODO: perhaps we should just have EVERY unform passed as an array or
    // a function returning an array. This would save some checks and simplify
    // things a bit.
    if (!anim) {
      // no anim means the meaningful animation is that the track is active
      // in which case it's value is 1.
      return 1;
    }
    if (typeof anim == "function") {
      return anim(clip_time);
    }
    if (config.UNIFORM_INTERPOLATION_ENABLED) {
      //console.log("animate weith clip time", clip_time);
      return animate(deep_clone(anim), clip_time);
    } else {
      // TODO we should just do linear interpolation if we want to save space.
      // I don't think that only having constants here is useful.
      return anim;
    }
  }
  // Inactive track. Return undefined here, but resole_animation_track will
  // put 0 in the uniforms rather than undefined.
}

function editor_assert_valid_uniform(val) {
  if (config.EDITOR) {
    if (typeof val == "undefined") {
      return;
    }

    if (val.length == undefined) {
      console.log("Warning! expected uniform to be an array, got", val, "of type", typeof val);
    }
  }
}

function resole_animation_track(track, time) {
  for (var c in track) {
    var clip = track[c];
    var val = resolve_animation_clip(clip, time)
    editor_assert_valid_uniform(val);
    if (val) {
      return val;
    }
  }
  // Inactive track (resolve_animation_clip returned undefined for all clips)
  return 0;
}

function resolve_animations(time) {
  for (track in sequence) {
    uniforms[track] = resole_animation_track(sequence[track], time);
  }
}

function render_pass(pass, time) {
  if (pass.enabled) {
    if (!uniforms[pass.enabled]) {
      return;
    }
  }

  if (config.GL_DEBUG && config.GL_DEBUG_TRACE) {
    console.log("== PASS ==", pass);
  }

  // actual render

  var resolution = prepare_render_to_texture(pass);
  gl.viewport(0, 0, resolution[0], resolution[1]);
  uniforms["u_resolution"] = resolution;

  prepare_clear(pass);

  var shader_program = get_shader_program(pass);
  if (!shader_program) {
    return;
  }

  gl.useProgram(shader_program);

  set_uniforms(shader_program, resolution[0] / resolution[1]);

  prepare_texture_inputs(pass, shader_program);

  prepare_blending(pass);

  prepare_depth_test(pass);

  if (config.SCENES_ENABLED && pass.scene) {
    render_with_scenes(pass, shader_program);
  } else {
    render_without_scenes(pass, shader_program);
  }

  cleanup_texture_inputs(pass);
}

function render_sequence(sequence, time) {
  if (config.GL_DEBUG && config.GL_DEBUG_TRACE) {
    console.log("== FRAME START ==");
  }
  resolve_animations(time);
  render_passes.map(function(pass) {
    render_pass(pass, time)
  });
  if (config.GL_DEBUG && config.GL_DEBUG_TRACE) {
    console.log("== FRAME END ==");
  }
}

function prepare_depth_test(pass) {
  if (config.DEPTH_TEST_ENABLED) {
    if (pass.depth_test) {
      gl.enable(gl.DEPTH_TEST);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }
  }
}

function prepare_blending(pass) {
  if (config.BLENDING_ENABLED) {
    gl.disable(gl.BLEND);
    if (pass.blend) {
      gl.enable(gl.BLEND);
      gl.blendFunc.apply(gl, pass.blend);
    }
  }
}

function prepare_clear(pass) {
  if (config.CLEAR_ENABLED) {
    if (pass.clear) {
      gl.clearColor(pass.clear[0], pass.clear[1], pass.clear[2], pass.clear[3]);
      gl.clearDepth(1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
  }
}

function init_render_to_texture(sequence) {
  if (config.RENDER_TO_TEXTURE_ENABLED) {
    // replace the render passes' texture arrays by actual frame buffer objects
    // this is far from optimal...
    for (var p in render_passes) {
      var pass = render_passes[p];
      if (pass.render_to) {
        pass.fbo = frame_buffer(pass.render_to);
      }
    }
  }
}

function frame_buffer(target) {
  var fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);

  if (target.color && textures[target.color]) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures[target.color].tex, 0);
  if (target.depth && textures[target.depth]) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, textures[target.depth].tex, 0);

  if (config.GL_DEBUG) {
    var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status != gl.FRAMEBUFFER_COMPLETE) {
      console.error("Incomplete framebuffer", WebGLDebugUtils["glEnumToString"](status));
    }
  }

  return fbo;
}

function prepare_render_to_texture(pass) {
  if (config.RENDER_TO_TEXTURE_ENABLED) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, pass.fbo);

    var target = pass.render_to ? textures[pass.render_to.color] : canvas;
    return [target.width, target.height]
  } else {
    return [canvas.width, canvas.height];
  }
}

function get_geometry(geometry_name) {
  if (config.EDITOR) {
    if (!geometry_name) {
      return null;
    }
    var geometry = geometries[geometry_name];

    if (!geometry) {
      console.log("Missing geometry "+obj.geometry+" (using placeholder)");
      geometry = geometry_placeholder
    }

    return geometry;
  } else {
    return geometries[geometry_name];
  }
}

function get_shader_program(pass) {
  if (config.EDITOR) {
    if (!pass.program) {
      return null;
    }

    var shader_program = programs[pass.program]

    if (!shader_program) {
      if (pass.program) {
        console.log("Missing program "+pass.program+" (using placeholder)");
      }
      shader_program = placeholder_program;
    }
    return shader_program;
  } else {
    return programs[pass.program];
  }
}

function render_without_scenes(pass, shader_program) {
  var geometry = geometries[pass.geometry]

  if (config.EDITOR) {
    if (!geometry) {
      console.log("Missing geometry " + pass.geometry + " (using placeholder)");
      geometry = geometry_placeholder
    }
  }

  var instance_id_location = gl.getUniformLocation(shader_program, "instance_id");
  draw_geom(geometry, pass.instance_count, instance_id_location);
}

function render_with_scenes(pass, shader_program) {
  // A scene can be inlined in the sequence...
  var scene = pass.scene;
  if (typeof scene == "string") {
    // ...or in its own asset
    scene = scenes[pass.scene];
  }

  // This allows us to inline the object list without the other members of the scene
  // for convenience and space.
  //    scenes: { objects: [{geometry: "quad"}] },
  // is quivalent to:
  //    scenes: [{geometry: "quad"}],
  var scene_objects = scene.objects || scene;

  // TODO[nical] do we want this?
  // send_uniforms(shader_program, scene.uniforms, clip_time);

  for (var g = 0; g < scene_objects.length; ++g) {
    var obj = scene_objects[g];

    var geometry = get_geometry(obj.geometry);

    // this is optional, but can be a convenient info to have in the shader.
    obj.uniforms = obj.uniforms || {};
    obj.uniforms["u_object_id"] = [g];

    send_uniforms(shader_program, obj.uniforms);

    draw_geom(geometry)
  }
}
