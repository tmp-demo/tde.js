
// general naming rule: things that have offset in the name are offsets in
// an array, while things with index in the name are indices that should be
// multiplied by a stride to obtain the offset.

// ring: [[x,y,z]]
// geom: {vbo, ibo, v_stride, v_cursor, i_cursor}
// v_cursor is an index (in vertex, not an offset in the array).
// Use v_cursor * v_stride for an offset in the array.


var SEED = 42;
function seedable_random() {
    return (SEED = (69069 * SEED + 1) & 0x7FFFFFFF) / 0x80000000;
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
    var v1 = vec2.create();
    var v2 = vec2.create();
    for (var i = 0; i < path_length; ++i) {
        vec2.subtract(v1, path[(i+1)%path_length], path[i]);
        vec2.subtract(v2, path[(i+2)%path_length], path[(i+1)%path_length]);
        vec2.cross(c, v1, v2);
        if (c[2] > 0) {
            return false;
        }
    }
    return true;
}

function make_ring(path, y) {
  var ring = []
  for (var i = 0; i < path.length; i++)
  {
    var point = path[i]
    ring.push([point[0], y, -point[1]])
  }
  return ring
}

function push_vertices(to, v) {
    for (var i = 0; i<v.length; ++i) {
        for (var j = 0; j<v[i].length; ++j) {
            to.push(v[i][j]);
        }
    }
}

function join_rings(geom, r1, r2, uv_fn) {
    // #debug{{
    if (r1.length != r2.length) {
        console.log(r1);
        console.log(r2);
        alert("rings of incompatible sizes: "+r1.length+" "+r2.length);
    }
    // #debug}}

    var e1 = vec3.create()
    var e2 = vec3.create()
    var normal = [0,0,0]
    for (var i = 0; i < r1.length; i++)
    {
      var next = (i + 1) % r1.length;
      push_vertices(geom.positions, [r1[i], r1[next], r2[next], r2[next], r2[i], r1[i]]);

      vec3.sub(e1, r2[next], r1[i]);
      vec3.sub(e2, r1[next], r1[i]);
      vec3.cross(normal, e1, e2);
      vec3.normalize(normal, normal);
      push_vertices(geom.normals, [normal, normal, normal, normal, normal, normal]);
      push_vertices(geom.uvs, uv_fn(vec3.length(e2)));
    }
}

function rand_int(max) {
    return M.floor(seedable_random() * max);
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
        (a * (b1[1] - b2[1]) - b * (a1[1] - a2[1])) / det
    ];
}

var SUBDIV_SHRINK_COEF = 0.01;

function shrink_path(path, amount, z, use_subdiv) {
    var new_path = [];
    var path_length = path.length;
    var pna = vec2.create();
    var pnxa = vec2.create();
    var pnb = vec2.create();
    var pnxb = vec2.create();
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

        vec2.add(pna, pa, na);
        vec2.add(pnb, pb, nb);
        vec2.add(pnxa, px, na);
        vec2.add(pnxb, px, nb);

        var inter = lines_intersection_2d(pna, pnxa, pnxb, pnb );

        // If inter is null (pa, px and pb are aligned)
        inter = inter || [pnxa[0], pnxa[1]];
        inter.subdiv = path[i].subdiv;
        new_path.push(inter);
    }

    var old_segment = vec2.create();
    var new_segment = vec2.create();
    for (var i = 0; i < path_length; ++i) {
        vec2.subtract(old_segment, path[(i+1)%path_length], path[i]);
        vec2.subtract(new_segment, new_path[(i+1)%path_length], new_path[i]);
        //var cross = vec3.create();
        //vec3.cross(cross, new_path[i], new_path[i]+1)
        //if (cross[1] > 0) {
        //    return null;
        //}
        if (vec2.dot(old_segment, new_segment) < 0) {
            return null;
        }
    }
    return new_path;
}

function fill_convex_ring(geom, ring) {
  var normal = [0, 1, 0];
  var uv = [0, 0];
  for (var i = 1; i < ring.length - 1; i++) {
      push_vertices(geom.positions, [ring[0], ring[i], ring[i + 1]]);
      push_vertices(geom.normals, [normal, normal, normal]);
      push_vertices(geom.uvs, [uv, uv, uv]);
  }
}

function city_subdivision_rec(paths, num_subdivs, sub_id) {
    if (sub_id < 0) { sub_id = 0; }
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
        var d = vec2.distance(path[i], path[(i+1)%path_length]);
        if (d > maxd) {
            maxd = d;
            a1 = i;
        }
        perimeter += d;
    }

    if (perimeter < MIN_PERIMETER) { return null; }

    var a2 = (a1+1) % path_length;
    var b1, b2, p_a3, p_b3;

    //var guard = 0;
    do {
        b1 = rand_int(path_length);
        if (a1 == b1 || a1 == b1 + 1) { continue; }
        //if (guard++ > 10) { break; }

        b2 = (b1+1) % path_length;

        // TODO: this skews the distribution towards 0.5 - make it less verbose
        var f1 = 0.5 + (0.5 - M.abs(seedable_random() - 0.5)) * 0.2;
        var f2 = 0.5 + (0.5 - M.abs(seedable_random() - 0.5)) * 0.2;

        var p_a3_1 = { '0': path[a1][0]*f1 + path[a2][0]*(1.0-f1), '1': path[a1][1]*f1 + path[a2][1]*(1-f1), subdiv: sub_id};
        var p_a3_2 = { '0': path[a1][0]*f1 + path[a2][0]*(1.0-f1), '1': path[a1][1]*f1 + path[a2][1]*(1-f1), subdiv: path[a1].subdiv};
        var p_b3_1 = { '0': path[b1][0]*f2 + path[b2][0]*(1.0-f2), '1': path[b1][1]*f2 + path[b2][1]*(1-f2), subdiv: sub_id};
        var p_b3_2 = { '0': path[b1][0]*f2 + path[b2][0]*(1.0-f2), '1': path[b1][1]*f2 + path[b2][1]*(1-f2), subdiv: path[b1].subdiv};

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

function circle_path(num_edges, sx, sy) {
    var c = [];
}












// Testing...
// if this code below ends up in the minified export, something's wrong.

function debug_draw_path(path, color, offset_x, offset_y) {
    map_ctx.strokeStyle = color;
    for (var i in path) {
        map_ctx.beginPath();
        map_ctx.moveTo(
            (path[i][0] + offset_x + 1000) / 6,
            (path[i][1] + offset_y) / 6
        );
        map_ctx.lineTo(
            (path[mod(i-1, path.length)][0] + offset_x + 1000) / 6,
            (path[mod(i-1, path.length)][1] + offset_y) / 6
        );
        map_ctx.stroke();
        map_ctx.closePath();
    }
}

/*function arrays_equal(a1, a2) {
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
*/
