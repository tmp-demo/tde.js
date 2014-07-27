
// general naming rule: things that have offset in the name are offsets in
// an array, while things with index in the name are indices that should be
// multiplied by a stride to obtain the offset.

// ring: [[x,y,z]]
// geom: {vbo, ibo, v_stride, v_cursor, i_cursor}
// v_cursor is an index (in vertex, not an offset in the array).
// Use v_cursor * v_stride for an offset in the array.


// see the variable skip below
var CONTINUOUS_PATH = 1;    //P1-----p2-----p3-------p4
var DISCONTINUOUS_PATH = 2; //P1-----p2     p3-------p4

function join_rings(geom, r1, r2, skip) {
    // #debug{{
    if (r1.length != r2.length) {
        console.log(r1);
        console.log(r2);
        alert("rings of incompatible sizes: "+r1.length+" "+r2.length);
    }
    // #debug}}

    // if skip is 2: P1-----p2     p3-------p4
    // if skip is 1: P1-----p2-----p3-------p4
    // Sorry guys, it's a bit cryptic, I'll sort this out eventually or throw it away
    // if skip is 2, inv_skip is 1
    // if skip is 1, inv_skip is 2
    var inv_skip = 2 / skip;

    // populate the vertex buffer
    var v_stride = geom.v_stride;
    var n_vertices = r1.length;
    var v_cursor1 = geom.v_cursor;
    var v_cursor2 = v_cursor1 + n_vertices*inv_skip;
    var vbo = geom.vbo;
    var i = 0;
    for (var s = 0; s < inv_skip; ++s) {
        for (var i = 0; i < n_vertices; ++i) {
            // ring 1
            vbo[(v_cursor1+i*inv_skip+s)*v_stride    ] = r1[i][0];
            vbo[(v_cursor1+i*inv_skip+s)*v_stride + 1] = r1[i][1];
            vbo[(v_cursor1+i*inv_skip+s)*v_stride + 2] = r1[i][2];
            // ring 2
            vbo[(v_cursor2+i*inv_skip+s)*v_stride    ] = r2[i][0];
            vbo[(v_cursor2+i*inv_skip+s)*v_stride + 1] = r2[i][1];
            vbo[(v_cursor2+i*inv_skip+s)*v_stride + 2] = r2[i][2];
        }
    }

    // populate the index buffer
    var i_cursor = geom.i_cursor;
    var ibo = geom.ibo;
    for (var i = 0; i < n_vertices/skip; ++i) {
        // first triangle
        ibo[i_cursor + i*6    ] = v_cursor1 +  i*skip;
        ibo[i_cursor + i*6 + 1] = v_cursor2 +  i*skip;
        ibo[i_cursor + i*6 + 2] = v_cursor2 + (i*skip+1);
        // second triangle
        ibo[i_cursor + i*6 + 3] = v_cursor1 +  i*skip;
        ibo[i_cursor + i*6 + 4] = v_cursor2 + (i*skip+1);
        ibo[i_cursor + i*6 + 5] = v_cursor1 + (i*skip+1);
    }

    // bump cursors

    // 2 because we inject the vertices of the two rings and
    // inv_skip is equal to 2 if we inject those vertice twice (continuous path)
    // inv_skip is equal to 1 if we inject those vertice one (discontinuous path)
    geom.v_cursor += 2*n_vertices * inv_skip;
    geom.i_cursor += n_vertices * 6 / skip; // 6 is the number of indices per quad
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
    console.log(vbo);
}

function console_log(a, label) {
    console.log(a);
}

// --

function rand_int(max) {
    return Math.floor(Math.random() * max);
}

function mod (a, m) {
  return (a%m+m)%m;
}

function _vector(a,b) { return vec2.subtract([], b, a) }
function _vec2_add(a,b) { return vec2.add([], a, b) }
function _vec2_scale(v, f) { return [v[0]*f, v[1]*f] }

function normal(v) {
    var l = vec2.length(v);
    return [-v[1]/l, v[0]/l]
}

function lines_intersection_2d(a1, a2, b1, b2) {
    var det = (a1[0]-a2[0])*(b1[1]-b2[1]) - (a1[1]-a2[1])*(b1[0]-b2[0]);
    if (det*det < 0.0000001) { return null }
    var a = (a1[0]*a2[1]- a1[1]*a2[0]);
    var b = (b1[0]*b2[1]- b1[1]*b2[0]);
    return [
        (a * (b1[0] - b2[0]) - b * (a1[0] - a2[0])) / det,
        (a * (b1[1] - b2[1]) - b * (a1[1] - a2[1])) / det,
        0
    ]
}

function extrude_path(path, amount) {
    var new_path = [];
    var path_length = path.length;
    for (var i = 0; i < path_length; ++i) {
        var pa = path[mod(i-1, path_length)];
        var px = path[mod(i, path_length)];
        var pb = path[mod(i+1, path_length)];
        var na = _vec2_scale(normal(_vector(pa, px)), amount * (10 - pa.subdiv) * 0.3);
        var nb = _vec2_scale(normal(_vector(px, pb)), amount * (10 - px.subdiv) * 0.3);

        var inter = lines_intersection_2d(
            _vec2_add(pa, na),
            _vec2_add(px, na),
            _vec2_add(px, nb),
            _vec2_add(pb, nb)
        );

        if (inter !== null) {
            inter.subdiv = path[i].subdiv;
            new_path.push(inter);
        } else {
            alert("null intersection");
        }
    }
    return new_path;
}

function city_subdivision_rec(paths, num_subdivs, sub_id) {
    if (sub_id === undefined) { sub_id = 0 }
    var sub_paths = [];
    for (var i in paths) {
        var sub = city_subdivision(paths[i], sub_id)
        if (!sub) {
            sub_paths.push(paths[i]);
        }
        else {
            sub_paths.push(sub[0]);
            sub_paths.push(sub[1]);
        }
    }
    if (num_subdivs == 1) {
        return sub_paths;
    }
    return city_subdivision_rec(sub_paths, num_subdivs - 1, sub_id + 1);
}

// TODO make this show in the editor: it defines how the min size of city blocks
MIN_PERIMETER = 400;
EXTRUSION_FACTOR = 2;
MIN_SEGMENT = 3* EXTRUSION_FACTOR;

function city_subdivision(path, sub_id) {
    var path_length = path.length;

    var a1;
    var maxd = 0;
    var perimeter = 0;
    // pick the longest segment
    for (var i = 0; i < path_length; ++i) {
        var d = vec2.distance(path[i], path[mod(i+1, path_length)]);
        if (d < MIN_SEGMENT) { return null; }
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
        if (a1 == b1) { continue; }

        if (guard++ > 10) { break; }
        if (a1 == b1 + 1) { continue; }

        b2 = mod((b1+1), path_length);

        // TODO: this skews the distribution towards 0.5 - make it less verbose
        var f1 = 0.5 + (0.5 - Math.abs(Math.random() - 0.5)) * 0.2;
        var f2 = 0.5 + (0.5 - Math.abs(Math.random() - 0.5)) * 0.2;

        p_a3_1 = { '0': path[a1][0]*f1 + path[a2][0]*(1.0-f1), '1': path[a1][1]*f1 + path[a2][1]*(1-f1), '2': 0, subdiv: sub_id};
        p_a3_2 = { '0': path[a1][0]*f1 + path[a2][0]*(1.0-f1), '1': path[a1][1]*f1 + path[a2][1]*(1-f1), '2': 0, subdiv: path[a1].subdiv};
        p_b3_1 = { '0': path[b1][0]*f2 + path[b2][0]*(1.0-f2), '1': path[b1][1]*f2 + path[b2][1]*(1-f2), '2': 0, subdiv: sub_id};
        p_b3_2 = { '0': path[b1][0]*f2 + path[b2][0]*(1.0-f2), '1': path[b1][1]*f2 + path[b2][1]*(1-f2), '2': 0, subdiv: path[b1].subdiv};

        //console.log("inter.subdiv: "+ inter.subdiv);

        break;
    } while (1);

    var path1 = [p_a3_1, p_b3_2]
    for (var i = b2; i != a2; i = mod((i+1), path_length)) {
        path1.push(path[i]);
    }

    var path2 = [p_b3_1, p_a3_2]
    for (var i = a2; i != b2; i = mod((i+1), path_length)) {
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
