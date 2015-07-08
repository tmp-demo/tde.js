{
  type: "js",
  generator: function() {
    var num_chunks = 64;
    var positions = [];
    var stride = 1;
    var num_lines = 22;
    for (var i = 0; i < num_lines; ++i) {
      for (var j = 0; j < num_chunks; ++j) {
          var step = 1/num_chunks;
          var norm_j = (j*stride) *step;
          pack_vertices(positions, [
              [-1, norm_j,      i],
              [ 1, norm_j,      i],
              [-1, norm_j+step, i],
              [-1, norm_j+step, i],
              [ 1, norm_j+step, i],
              [ 1, norm_j,      i],
          ]);
      }
    }
    //console.log(positions);
    return {
      buffers: [ make_vbo(POS, positions) ],
      mode: gl.TRIANGLES,
      vertex_count: positions.length / 3
    };
  }
}
