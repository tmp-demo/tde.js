//
// texture_inputs takes care of automatically sending the right textures to the shader uniforms.
//
// To disable this feature, replace the two functions below by empty functions.
//


function prepare_texture_inputs(pass, shader_program) {
  var texture_inputs = pass.texture_inputs || [];

  for (var i=0; i<texture_inputs.length; ++i) {
    var texture = textures[texture_inputs[i]];
    //#debug{{
    if (!texture) {
      // TODO: should use a placeholder texture or something.
      // This can happen in the editor if a frame is rendered
      // while a texture is not loaded yet.
      console.log("render_pass: missing texture "+pass.texture_inputs[i]);
      return;
    }
    //#debug}}
    var tex = texture.tex;
    gl.activeTexture(texture_unit(i));
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(gl.getUniformLocation(shader_program,"texture_"+i), i);
  }
}

function cleanup_texture_inputs(pass) {
  // we may be able to remove this loop to loose a few bytes
  if (!pass.texture_inputs) { return; }
  for (var i=0; i<pass.texture_inputs.length; ++i) {
    gl.activeTexture(texture_unit(i));
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}

