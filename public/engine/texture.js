function create_texture(width, height, format, data, allow_repeat, linear_filtering, mipmaps, float_tex) {
  if (EDITOR) {
    if (float_tex && data) {
      // wouldn't be hard to add, but we haven't needed it yet.
      console.log("!!! We don't support uploading data to float textures, something may be busted.");
    }

    if ((format == gl.DEPTH_COMPONENT) && (linear_filtering || mipmaps || float_tex)) {
      // bug somewhere
      console.log("!!! Creating a depth texture with broken parameters, it won't work.");
    }
  }

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
                (TEXTURE_FLOAT_ENABLED && float_tex) ? gl_ext_half_float.HALF_FLOAT_OES
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

function prepare_texture_inputs(pass, shader_program) {
  if (TEXTURE_INPUTS_ENABLED) {
    var texture_inputs = pass.texture_inputs || [];

    for (var i=0; i<texture_inputs.length; ++i) {
      var texture = textures[texture_inputs[i]];
      if (EDITOR) {
        if (!texture) {
          // TODO: should use a placeholder texture or something.
          // This can happen in the editor if a frame is rendered
          // while a texture is not loaded yet.
          console.log("render_pass: missing texture "+pass.texture_inputs[i]);
          return;
        }
      }
      var tex = texture.tex;
      gl.activeTexture(texture_unit(i));
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(gl.getUniformLocation(shader_program,"texture_"+i), i);
    }
  }
}

function cleanup_texture_inputs(pass) {
  if (TEXTURE_INPUTS_ENABLED) {
    // we may be able to remove this loop to loose a few bytes
    if (!pass.texture_inputs) { return; }
    for (var i=0; i<pass.texture_inputs.length; ++i) {
      gl.activeTexture(texture_unit(i));
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }
}
