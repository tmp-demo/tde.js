
function render(pass, shader_program, clip_time) {
  if (pass.geometry) {
    var geometry = geometries[pass.geometry]

    //#debug{{
    if (!geometry) {
      console.log("Missing geometry "+pass.geometry+" (using placeholder)");
      geometry = geometry_placeholder
    }
    //#debug}}

    var instance_count = pass.instance_count || 1;
    var instance_id_location = gl.getUniformLocation(shader_program, "instance_id");
    for (var k = 0; k < instance_count; k++) {
      gl.uniform1f(instance_id_location, k);
      draw_geom(geometry);
    }
  }
}
