
function render(pass, shader_program, clip_time) {
  if (pass.scene) {
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

    send_uniforms(shader_program, scene.uniforms, clip_time);

    for (var g = 0; g < scene_objects.length; ++g) {
      var obj = scene_objects[g];

      var geometry = get_geometry(obj.geometry);

      // this is optional, but can be a convenient info to have in the shader.
      obj.uniforms = obj.uniforms || {};
      obj.uniforms["u_object_id"] = g;

      send_uniforms(shader_program, obj.uniforms, clip_time);

      draw_geom(geometry)
    }
  }
}

