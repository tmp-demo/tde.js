
function on_resize() {
  canvas.width = demo.w;
  canvas.height = demo.h;
  gl.viewport(0, 0, demo.w, demo.h);
}

function gl_init() {
  canvas = document.getElementsByTagName("canvas")[0];
  gl = canvas.getContext("experimental-webgl");
  on_resize();
}

_quad_vbo = null;

function gfx_init() {
  console.log("gfx_init");

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

function draw_quad() {
  //console.log("draw_quad");
  gl.disable(gl.DEPTH_TEST);
  gl.bindBuffer(gl.ARRAY_BUFFER, _quad_vbo);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// type: gl.VERTEX_PROGRAM or gl.FRAGMENT_PROGRAM
function compile_shader(txt_src, type) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, txt_src);
  gl.compileShader(shader);
  if ( !gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert("Shader compilation failed: " + gl.getShaderInfoLog(shader));
  }
  return shader;
}

function shader_program(vs, fs) {
  var program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    alert("Program link error: " +
          gl.getProgramParameter(program, gl.VALIDATE_STATUS) +
          "\nERROR: " + gl.getError());
  }
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

function texture_unit(i) {
  if (i==0) return gl.TEXTURE0;
  if (i==1) return gl.TEXTURE1;
  if (i==2) return gl.TEXTURE2;
  if (i==3) return gl.TEXTURE3;
  alert("asked for unsupported texture unit " + i); //#opt  
}

function color_attachment(i) {
  if (i==0) return gl.COLOR_ATTACHMENT0;
  if (i==1) return gl.COLOR_ATTACHMENT1;
  if (i==2) return gl.COLOR_ATTACHMENT2;
  if (i==3) return gl.COLOR_ATTACHMENT3;
  alert("asked for unsupported color attachment " + i); //#opt
}

function frame_buffer_error(e) {
  if (e == gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT) {return "FRAMEBUFFER_INCOMPLETE_ATTACHMENT";}
  if (e == gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT) {return "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";}
  if (e == gl.FRAMEBUFFER_INCOMPLETE_DRAW_BUFFER) {return "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT";}
  if (e == gl.FRAMEBUFFER_UNSUPPORTED) {return "FRAMEBUFFER_UNSUPPORTED";}
  if (e == gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE) {return "FRAMEBUFFER_INCOMPLETE_MULTISAMPLE";}
  //if (e == gl.FRAMEBUFFER_INCOMPLETE_READ_BUFFER​) {return "FRAMEBUFFER_INCOMPLETE_READ_BUFFER​";}
  //if (e == gl.FRAMEBUFFER_INCOMPLETE_LAYER_TARGETS​) {return "FRAMEBUFFER_INCOMPLETE_LAYER_TARGETS​";}
  return "unknown framebuffer error";
}

function frame_buffer(textures) {
  var fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  for (var t=0; t<textures.length;++t) {
      gl.framebufferTexture2D(gl.FRAMEBUFFER, color_attachment(t), gl.TEXTURE_2D, textures[t], 0);
  }
  var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status != gl.FRAMEBUFFER_COMPLETE) {
    alert("incomplete framebuffer "+frame_buffer_error(status));
  }
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
    pass.render();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}
