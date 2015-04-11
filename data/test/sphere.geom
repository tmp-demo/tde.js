{
  type: "js",
  generator: function() {
    var positions = make_sphere(10, 5);
    var normals = map_triangles(positions, flat_normal);
    var triangle_ids = map_triangles(positions, triangle_index);
    return {
      buffers: [
        make_vbo(POS, positions),
        make_vbo(NORMAL, normals),
        make_vbo(TRIANGLE_ID, triangle_ids)
    ],
      mode: gl.TRIANGLES,
      vertex_count: positions.length / 3
    };
  }
}
