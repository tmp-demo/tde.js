
// general naming rule: things that have offset in the name are offsets in
// an array, while things with index in the name are indices that should be
// multiplied by a stride to obtain the offset.

// ring: [[x,y,z]]
// geom: {vbo, ibo, v_stride, v_cursor, i_cursor}
// v_cursor is an index (in vertex, not an offset in the array).
// Use v_cursor * v_stride for an offset in the array.


var seed = 42;
function seedable_random() {
    return (seed = (69069 * seed + 1) & 0x7FFFFFFF) / 0x80000000;
}

// For a continuous ring of 4 points the indices are:
//    0    1
//  7 A----B 2
//    |    |
//    |    |
//  6 D----C 3
//    5    4
//
// The slice of the vbo for this ring looks like:
// [A, B, B, C, C, D, D, A]
//
// Continuous rings are what the city generator outputs, but join_rings
// takes discontinuous rings as inputs:
//
// For a discontinuous ring of 4 points the indices are:
//    0    1
//    A----B
//
//
//    C----D
//    3    2
//
// The slice of the vbo for this ring looks like:
// [A, B, C, D]

function is_path_convex(path) {
    var path_length = path.length;
    var c = vec3.create();
    var v1 = vec3.create();
    var v2 = vec3.create();
    for (var i = 0; i < path_length; ++i) {
        vec3.subtract(v1, path[(i+1)%path_length], path[i]);
        vec3.subtract(v2, path[(i+2)%path_length], path[(i+1)%path_length]);
        vec3.cross(c, v1, v2);
        if (c[2] > 0) {
            return false;
        }
    }
    return true;
}

// Creates a continuous path [A, B, B, C, C, D, D, A] from a discontinuous
// one [A, B, C, D]
function continuous_path(path) {
    var new_path = [path[0]];
    for (var i = 1; i < path.length; ++i) {
        new_path.push(path[i], path[i]);
    }
    new_path.push(path[0]);
    return new_path;
}

function join_rings(geom, r1, r2) {
    // #debug{{
    if (r1.length != r2.length) {
        console.log(r1);
        console.log(r2);
        alert("rings of incompatible sizes: "+r1.length+" "+r2.length);
    }
    // #debug}}

    // populate the vertex buffer
    var v_stride = geom.v_stride;
    var n_points = r1.length;
    var v_cursor1 = geom.v_cursor;
    var v_cursor2 = v_cursor1 + n_points;
    var vbo = geom.vbo;
    for (var i = 0; i < n_points; ++i) {
        // The closure compiler unrolls small loops like following one, so it's
        // useless to try to factor repetitive xyz stuff in small loops.
        //for (var xyz = 0; xyz < 3; ++xyz) {
        //    vbo[(v_cursor1+i)*v_stride + xyz] = r1[i][xyz];
        //    vbo[(v_cursor2+i)*v_stride + xyz] = r2[i][xyz];
        //}

        // ring 1
        vbo[(v_cursor1+i)*v_stride    ] = r1[i][0];
        vbo[(v_cursor1+i)*v_stride + 1] = r1[i][1];
        vbo[(v_cursor1+i)*v_stride + 2] = r1[i][2];
        // ring 2
        vbo[(v_cursor2+i)*v_stride    ] = r2[i][0];
        vbo[(v_cursor2+i)*v_stride + 1] = r2[i][1];
        vbo[(v_cursor2+i)*v_stride + 2] = r2[i][2];
    }

    // populate the index buffer
    var i_cursor = geom.i_cursor;
    var ibo = geom.ibo;
    for (var i = 0; i < n_points/2; ++i) {
        // first triangle
        ibo[i_cursor + i*6    ] = v_cursor1 +  i*2;
        ibo[i_cursor + i*6 + 1] = v_cursor2 +  i*2;
        ibo[i_cursor + i*6 + 2] = v_cursor2 + (i*2+1);
        // second triangle
        ibo[i_cursor + i*6 + 3] = v_cursor1 +  i*2;
        ibo[i_cursor + i*6 + 4] = v_cursor2 + (i*2+1);
        ibo[i_cursor + i*6 + 5] = v_cursor1 + (i*2+1);
    }

    // Bump cursors
    //
    // 2 because we inject the vertices of the two rings and
    geom.v_cursor += 2 * n_points;
    // 6 (indices per edge) divided by 2 (points per edge)
    geom.i_cursor += n_points * 3;
}


// normal offset *is* an offset (so don't multiply by the stride)
function compute_normals(geom, normal_offset, first_index, n_indices) {
    var vbo = geom.vbo;
    var ibo = geom.ibo;
    var v_stride = geom.v_stride;
    // advance 3 by 3 indices (triangle by triangle)
    var i = first_index;
    while (i < n_indices) {
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
        for (var j = 0; j < 3; ++j) { // x,y,z
            vbo[ibo[i  ]*v_stride + normal_offset + j] = p1[j];
            vbo[ibo[i+1]*v_stride + normal_offset + j] = p1[j];
            vbo[ibo[i+2]*v_stride + normal_offset + j] = p1[j];
        }

        i += 3;
    }
}

function rand_int(max) {
    return Math.floor(seedable_random() * max);
}

function mod(a, m) {
  return (a%m+m)%m;
}

// Yeah. I know.
function deep_clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function _vector_2d(a,b) { return vec2.subtract([], b, a) }
function _vec2_scale(v, f) { return [v[0]*f, v[1]*f] }
function _vec2_add(a,b) { return vec2.add([], a, b) }

function normal(v) {
    var l = vec2.length(v);
    return [-v[1]/l, v[0]/l]
}

function lines_intersection_2d(a1, a2, b1, b2) {
    var det = (a1[0]-a2[0])*(b1[1]-b2[1]) - (a1[1]-a2[1])*(b1[0]-b2[0]);
    if (det*det < 0.0001) { return null }
    var a = (a1[0]*a2[1]- a1[1]*a2[0]);
    var b = (b1[0]*b2[1]- b1[1]*b2[0]);
    return [
        (a * (b1[0] - b2[0]) - b * (a1[0] - a2[0])) / det,
        (a * (b1[1] - b2[1]) - b * (a1[1] - a2[1])) / det,
        0
    ];
}

SUBDIV_SHRINK_COEF = 0.01;

function shrink_path(path, amount, z, use_subdiv) {
    var new_path = [];
    var path_length = path.length;
    for (var i = 0; i < path_length; ++i) {
        var pa = path[mod(i-1, path_length)];
        var px = path[mod(i,   path_length)];
        var pb = path[mod(i+1, path_length)];
        use_subdiv = use_subdiv || 0;
        // avoid shrinking too much
        if (vec2.distance(pa, pb) < amount*(1+pa.subdiv*use_subdiv*SUBDIV_SHRINK_COEF*2)) {
            return deep_clone(path);
        }
        var na = _vec2_scale(normal(_vector_2d(pa, px)), amount * (1+pa.subdiv*use_subdiv*SUBDIV_SHRINK_COEF));
        var nb = _vec2_scale(normal(_vector_2d(px, pb)), amount * (1+px.subdiv*use_subdiv*SUBDIV_SHRINK_COEF));

        //This doesn't work because modifying pa modifies the content of path
        //var pxa = []; // px translated along na
        //var pxb = []; // px translated along nb
        //vec2.add(pa,  pa, na);
        //vec2.add(pxa, px, na);
        //vec2.add(pb,  pb, nb);
        //vec2.add(pxb, px, nb);
        //var inter = lines_intersection_2d(pa, pxa, pxb, pb);

        var inter = lines_intersection_2d(
            _vec2_add(pa, na),
            _vec2_add(px, na),
            _vec2_add(px, nb),
            _vec2_add(pb, nb)
        );

        // If inter is null (pa, px and pb are aligned)
        inter = inter || _vec2_add(px, na);
        inter[2] = z;
        inter.subdiv = path[i].subdiv;
        new_path.push(inter);
    }

    var old_segment = vec3.create();
    var new_segment = vec3.create();
    for (var i = 0; i < path_length; ++i) {
        vec3.subtract(old_segment, path[(i+1)%path_length], path[i]);
        vec3.subtract(new_segment, new_path[(i+1)%path_length], new_path[i]);
        if (vec3.dot(old_segment, new_segment) < 0) {
            return null;
        }
    }
    return new_path;
}

function fill_concave_path(geom, path) {
    var center = [];
    path_center(center, path);

    // populate the vertex buffer
    var v_stride = geom.v_stride;
    var n_points = path.length;
    var v_cursor = geom.v_cursor;
    var i_cursor = geom.i_cursor;
    var vbo = geom.vbo;
    var ibo = geom.ibo;
    vbo[v_cursor*v_stride  ] = center[0];
    vbo[v_cursor*v_stride+1] = center[1];
    vbo[v_cursor*v_stride+2] = center[2];
    v_cursor++;
    for (var i = 0; i < n_points; ++i) {
        vbo[(v_cursor+i)*v_stride    ] = path[i][0];
        vbo[(v_cursor+i)*v_stride + 1] = path[i][1];
        vbo[(v_cursor+i)*v_stride + 2] = path[i][2];

        ibo[i_cursor+i*3  ] = v_cursor - 1; // center
        ibo[i_cursor+i*3+1] = v_cursor + i;
        ibo[i_cursor+i*3+2] = v_cursor + (i+1)%n_points;
    }

    // Bump cursors
    geom.v_cursor += n_points + 1;
    geom.i_cursor += n_points * 3;
}

function path_center(out, path) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    var len = path.length;
    for (var i = 0; i < len; ++i) {
        vec3.add(out, out, path[i]);
    }
    vec3.multiply(out, out, [1/len, 1/len, 1/len]);
}

function city_subdivision_rec(paths, num_subdivs, sub_id) {
    var sub_paths = [];
    for (var i in paths) {
        var sub = city_subdivision(paths[i], sub_id)
        if (!sub) {
            sub_paths.push(paths[i]);
        }
        else {
            sub_paths.push(sub[0], sub[1]);
        }
    }
    if (num_subdivs == 1) {
        return sub_paths;
    }
    return city_subdivision_rec(sub_paths, num_subdivs - 1, sub_id - 1);
}

// TODO make this show in the editor: it defines how the min size of city blocks
var MIN_PERIMETER = 200;
var MIN_SEGMENT = 10;
var EXTRUSION_FACTOR = 2;

function perimeter(path) {
    var accum = 0;
    var path_length = path.length;
    for (var i = 0; i < path_length; ++i) {
        accum += vec2.distance(path[i], path[(i+1) % path_length]);
    }
    return accum;
}

function smallest_segment_length(path) {
    var smallest = 10000;
    var path_length = path.length;
    for (var i = 0; i < path_length; ++i) {
        var d = vec2.distance(path[i], path[(i+1) % path_length]);
        if (d < smallest) { smallest = d; }
    }
    return smallest;
}

function city_subdivision(path, sub_id) {
    var path_length = path.length;

    // a1 is the index of the point starting the first edge we'll cut.
    // b1 is the index of the point starting the second edge we'll cut.
    var a1;
    var maxd = 0;
    var perimeter = 0;
    var i; // loop index, taken out to win a few bytes
    // pick the longest segment
    for (i = 0; i < path_length; ++i) {
        var d = vec2.distance(path[i], path[mod(i+1, path_length)]);
        //if (d < MIN_SEGMENT) { return null; }
        if (d > maxd) {
            maxd = d;
            a1 = i;
        }
        perimeter += d;
    }

    if (perimeter < MIN_PERIMETER) { return null; }

    var a2 = mod((a1+1), path_length);
    var b1, b2, p_a3, p_b3;

    var guard = 0;
    do {
        b1 = rand_int(path_length);
        if (a1 == b1 || a1 == b1 + 1) { continue; }
        //if (guard++ > 10) { break; }

        b2 = mod((b1+1), path_length);

        // TODO: this skews the distribution towards 0.5 - make it less verbose
        var f1 = 0.5 + (0.5 - Math.abs(seedable_random() - 0.5)) * 0.2;
        var f2 = 0.5 + (0.5 - Math.abs(seedable_random() - 0.5)) * 0.2;

        var p_a3_1 = { '0': path[a1][0]*f1 + path[a2][0]*(1.0-f1), '1': path[a1][1]*f1 + path[a2][1]*(1-f1), '2': 0, subdiv: sub_id};
        var p_a3_2 = { '0': path[a1][0]*f1 + path[a2][0]*(1.0-f1), '1': path[a1][1]*f1 + path[a2][1]*(1-f1), '2': 0, subdiv: path[a1].subdiv};
        var p_b3_1 = { '0': path[b1][0]*f2 + path[b2][0]*(1.0-f2), '1': path[b1][1]*f2 + path[b2][1]*(1-f2), '2': 0, subdiv: sub_id};
        var p_b3_2 = { '0': path[b1][0]*f2 + path[b2][0]*(1.0-f2), '1': path[b1][1]*f2 + path[b2][1]*(1-f2), '2': 0, subdiv: path[b1].subdiv};

        break;
    } while (1);

    var path1 = [p_a3_1, p_b3_2]
    for (i = b2; i != a2; i = mod((i+1), path_length)) {
        path1.push(path[i]);
    }

    var path2 = [p_b3_1, p_a3_2]
    for (i = a2; i != b2; i = mod((i+1), path_length)) {
        path2.push(path[i]);
    }

    return [path1, path2];
}

function num_city_base_vertices(paths) {
    var accum = 0;
    for (var path in paths) {
        accum += paths[path].length;
    }
    return accum;
}

















// Testing...
// if this code below ends up in the minified export, something's wrong.

function debug_draw_path(path, color, offset_x, offset_y) {
    map_ctx.strokeStyle = color;
    for (var i in path) {
        map_ctx.beginPath();
        map_ctx.moveTo(
            path[i][0] + offset_x,
            path[i][1] + offset_y
        );
        map_ctx.lineTo(
            path[mod(i-1, path.length)][0] + offset_x,
            path[mod(i-1, path.length)][1] + offset_y
        );
        map_ctx.stroke();
        map_ctx.closePath();
    }
}

function arrays_equal(a1, a2) {
    if (a1.length != a2.length) {
        return false;
    }
    for (var i = 0; i < a1.length; ++i) {
        if (a1[i] !== a2[i]) {
            return false;
        }
    }
    return true;
}
function arrays_of_arrays_equal(a1, a2) {
    if (a1.length != a2.length) {
        return false;
    }
    for (var i = 0; i < a1.length; ++i) {
        if (!arrays_equal(a1[i], a2[i])) {
            return false;
        }
    }
    return true;
}

function test_join_rings() {
    console.log("BEGIN - test_join_rings...");
    var r1 = [
        [0,0,3],
        [1,0,3],
        [1,1,3],
        [0,1,3]
    ];
    var r2 = [
        [0,0,5],
        [1,0,5],
        [1,1,5],
        [0,1,5]
    ];

    if (!arrays_of_arrays_equal(continuous_path(r1), [
        [0,0,3],
        [1,0,3],
        [1,0,3],
        [1,1,3],
        [1,1,3],
        [0,1,3],
        [0,1,3],
        [0,0,3]
    ])) {
        console.log("test_join_rings failed: wrong continuous path");
        console.log(continuous_path(r1));
    }

    var floats_per_vertex = 8;
    var geom = {
        vbo: new Float32Array(r1.length * 4 * floats_per_vertex),
        ibo: new Uint16Array(r1.length * 6),
        v_stride: floats_per_vertex,
        v_cursor: 0, i_cursor: 0
    }

    join_rings(geom, continuous_path(r1), continuous_path(r2));
    if (!arrays_equal(geom.ibo, [
        0, 8, 9,
        0, 9, 1,
        2, 10, 11,
        2, 11, 3,
        4, 12, 13,
        4, 13, 5,
        6, 14, 15,
        6, 15, 7
    ])) {
        console.log("test_join_rings failed: wrong ibo (continuous)");
        console.log(geom.ibo);
    }

    if (!arrays_equal(geom.vbo, [
        // ring 1
        0,0,3, 0, 0, 0, 0, 0,
        1,0,3, 0, 0, 0, 0, 0,
        1,0,3, 0, 0, 0, 0, 0,
        1,1,3, 0, 0, 0, 0, 0,
        1,1,3, 0, 0, 0, 0, 0,
        0,1,3, 0, 0, 0, 0, 0,
        0,1,3, 0, 0, 0, 0, 0,
        0,0,3, 0, 0, 0, 0, 0,
        // ring 2
        0,0,5, 0, 0, 0, 0, 0,
        1,0,5, 0, 0, 0, 0, 0,
        1,0,5, 0, 0, 0, 0, 0,
        1,1,5, 0, 0, 0, 0, 0,
        1,1,5, 0, 0, 0, 0, 0,
        0,1,5, 0, 0, 0, 0, 0,
        0,1,5, 0, 0, 0, 0, 0,
        0,0,5, 0, 0, 0, 0, 0
    ])) {
        console.log("test_join_rings failed: wrong vbo (continuous)");
        console.log(geom.vbo);
    }

    // TODO: test the result of normals computation
    //compute_normals(geom, 0, 0, geom.ibo.length);
    //if (!arrays_equal(geom.vbo, [
    //    // ring 1
    //    0,0,3, 0, 0, 0, 0, 0,
    //    0,0,3, 0, 0, 0, 0, 0,
    //    1,0,3, 0, 0, 0, 0, 0,
    //    1,0,3, 0, 0, 0, 0, 0,
    //    1,1,3, 0, 0, 0, 0, 0,
    //    1,1,3, 0, 0, 0, 0, 0,
    //    0,1,3, 0, 0, 0, 0, 0,
    //    0,1,3, 0, 0, 0, 0, 0,
    //    // ring 2
    //    0,0,5, 0, 0, 0, 0, 0,
    //    0,0,5, 0, 0, 0, 0, 0,
    //    1,0,5, 0, 0, 0, 0, 0,
    //    1,0,5, 0, 0, 0, 0, 0,
    //    1,1,5, 0, 0, 0, 0, 0,
    //    1,1,5, 0, 0, 0, 0, 0,
    //    0,1,5, 0, 0, 0, 0, 0,
    //    0,1,5, 0, 0, 0, 0, 0
    //])) {
    //    console.log("test_join_rings failed: wrong normals in the vbo (continuous)");
    //}

    // ---  discontinuous paths  ---

    geom = {
        vbo: new Float32Array(r1.length * 2 * floats_per_vertex),
        ibo: new Uint16Array(r1.length * 6 / 2),
        v_stride: floats_per_vertex,
        v_cursor: 0, i_cursor: 0
    }

    join_rings(geom, r1, r2);
    if (!arrays_equal(geom.ibo, [
        0, 4, 5,
        0, 5, 1,
        2, 6, 7,
        2, 7, 3
    ])) {
        console.log("test_join_rings failed: wrong ibo (discontinuous)");
        console.log(geom.ibo);
    }

    if (!arrays_equal(geom.vbo, [
        // ring 1
        0,0,3, 0, 0, 0, 0, 0,
        1,0,3, 0, 0, 0, 0, 0,
        1,1,3, 0, 0, 0, 0, 0,
        0,1,3, 0, 0, 0, 0, 0,
        // ring 2
        0,0,5, 0, 0, 0, 0, 0,
        1,0,5, 0, 0, 0, 0, 0,
        1,1,5, 0, 0, 0, 0, 0,
        0,1,5, 0, 0, 0, 0, 0
    ])) {
        console.log("test_join_rings failed: wrong vbo (discontinuous)");
        console.log(geom.vbo);
    }

    console.log("END - test_join_rings");
}
