
// general naming rule: things that have offset in the name are offsets in
// an array, while things with index in the name are indices that should be
// multiplied by a stride to obtain the offset.

// ring: [[x,y,z]]
// geom: {vbo, ibo, v_stride, v_cursor, i_cursor}
// v_cursor is an index (in vertex, not an offset in the array).
// Use v_cursor * v_stride for an offset in the array.

function join_rings(geom, r1, r2) {
    // #debug{{
    if (r1.length != r2.length) {
        alert("rings of incomaptible sizes: "+r1.length+" "+r2.length);
    }
    // #debug}}

    // populate the vertex buffer
    var v_stride = geom.v_stride;
    var n_vertices = r1.length;
    var v_cursor1 = geom.v_cursor;
    var v_cursor2 = v_cursor1 + n_vertices;
    var vbo = geom.vbo;
    var i = 0;
    while (i < n_vertices) {
        // ring 1
        vbo[(v_cursor1+i)*v_stride    ] = r1[i][0];
        vbo[(v_cursor1+i)*v_stride + 1] = r1[i][1];
        vbo[(v_cursor1+i)*v_stride + 2] = r1[i][2];
        // ring 2
        vbo[(v_cursor2+i)*v_stride    ] = r2[i][0];
        vbo[(v_cursor2+i)*v_stride + 1] = r2[i][1];
        vbo[(v_cursor2+i)*v_stride + 2] = r2[i][2];
        ++i;
    }

    // populate the index buffer
    var i_cursor = geom.i_cursor;
    var ibo = geom.ibo;
    i = 0;
    while (i < n_vertices/2) {
        // first triangle
        ibo[i_cursor + i*6    ] = v_cursor1 +  i*2;
        ibo[i_cursor + i*6 + 1] = v_cursor2 +  i*2;
        ibo[i_cursor + i*6 + 2] = v_cursor2 + (i*2+1);
        // second triangle
        ibo[i_cursor + i*6 + 3] = v_cursor1 +  i*2;
        ibo[i_cursor + i*6 + 4] = v_cursor2 + (i*2+1);
        ibo[i_cursor + i*6 + 5] = v_cursor1 + (i*2+1);
        i++;
    }
    // bump cursors
    geom.v_cursor += 2*n_vertices;
    geom.i_cursor += n_vertices * 6 / 2;
}

// normal offset *is* an offset (so don't multiply by the stride)
function compute_normals(geom, normal_offset, first_index, n_indices) {
    var vbo = geom.vbo;
    var ibo = geom.ibo;
    var v_stride = geom.v_stride;
    // advance 3 by 3 indices (triangle by triangle)
    var i = first_index;
    while (i < n_indices) {
        // TODO[8k] this can be factored in a loop
        // P1
        var v_offset = ibo[i]*v_stride;
        var p1 = [
            vbo[v_offset],
            vbo[v_offset+1],
            vbo[v_offset+2]
        ];
        // P2
        v_offset = ibo[i+1]*v_stride;
        var v2 = [
            vbo[v_offset],
            vbo[v_offset+1],
            vbo[v_offset+2]
        ];
        // P3
        v_offset = ibo[i+2]*v_stride;
        var v3 = [
            vbo[v_offset],
            vbo[v_offset+1],
            vbo[v_offset+2]
        ];

        // P2 becomes the vector p1->p2
        vec3.sub(v2, v2, p1);
        // P3 becomes the vector p1->p3
        vec3.sub(v3, v3, p1);
        // P1 becomes the normal
        vec3.cross(p1, v2, v3);
        vec3.normalize(p1, p1);

        // write in the vbo
        var j = 0; // x,y,z
        while (j < 3) {
            // TODO[8k] this can be factored in a loop
            vbo[ibo[i  ]*v_stride + normal_offset + j] = p1[j];
            vbo[ibo[i+1]*v_stride + normal_offset + j] = p1[j];
            vbo[ibo[i+2]*v_stride + normal_offset + j] = p1[j];
            ++j;
        }
        i+=3;
    }
}
