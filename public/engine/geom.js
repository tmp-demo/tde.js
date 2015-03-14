
// general naming rule: things that have offset in the name are offsets in
// an array, while things with index in the name are indices that should be
// multiplied by a stride to obtain the offset.

// ring: [[x,y,z]]
// geom: {vbo, ibo, v_stride, v_cursor, i_cursor}
// v_cursor is an index (in vertex, not an offset in the array).
// Use v_cursor * v_stride for an offset in the array.

var SEED = 1;
function seedable_random() {
    return (SEED = (69069 * SEED + 1) & 0x7FFFFFFF) / 0x80000000;
}

function mid_point(a, b) {
    return [
        (a[0]+b[0])/2,
        (a[1]+b[1])/2,
        (a[2]+b[2])/2
    ];
}

function get_vec3(buffer, offset) {
    return [
        buffer[offset],
        buffer[offset+1],
        buffer[offset+2]
    ];
}

//      c
//     / \
//    /   \
//  ac --- bc
//  / \   / \
// /   \ /   \
//a-----ab----b

function subdivide(prev_buffer) {
    var output = [];
    for (var i=0; i<prev_buffer.length; i+=9) {
        var a = get_vec3(prev_buffer, i);
        var b = get_vec3(prev_buffer, i+3);
        var c = get_vec3(prev_buffer, i+6);
        var ab = mid_point(a, b);
        var bc = mid_point(b, c);
        var ac = mid_point(a, c);
        pack_vertices(output,[
            a,  ab, ac,
            ac, ab, bc,
            bc, ab, b,
            ac, bc, c
        ]);
    }
    return output;
}

//  a          b          c           d
// (1, 1, 1), (1,-1,-1), (-1, 1,-1), (-1,-1, 1)
function make_tetrahedron() {
    return [
         1, 1, 1,   1,-1,-1,  -1, 1,-1,  // abc
        -1,-1, 1,   1,-1,-1,   1, 1, 1,  // dba
        -1,-1, 1,  -1, 1,-1,   1,-1,-1,  // dcb
        -1,-1, 1,   1, 1, 1,  -1, 1,-1   // dac
    ];
}

function make_sphere(radius, num_subdivs) {
    var buffer = make_tetrahedron();
    while (num_subdivs-- > 0) {
        buffer = subdivide(buffer);
    }
    for (var i = 0; i < buffer.length; i+=3) {
        var len = vec3.length([buffer[i], buffer[i+1], buffer[i+2]]);
        buffer[i] *= radius/len;
        buffer[i+1] *= radius/len;
        buffer[i+2] *= radius/len;
    }
    return buffer;
}

// TODO: it's sorta convenient to have this for prototyping but I assume we'll
// have to not use this in the shipping demos and always generate from unpacked
// geometry rather than packing and unpacking to re-pack afterwards like
// map_triangles does.
// turns [a, b, c, d, e, f, g, h, i] into [[a, b, c], [d, e, f], [g, h, i]]
function unpack_vertices(vertices, offset, num_vertices) {
    var output = [];
    for(var i = offset; i < offset+num_vertices*3; i+=3) {
        output.push([vertices[i], vertices[i+1], vertices[i+2]]);
    }
    return output;
}

function map_triangles(positions, fn) {
    var output = [];
    for (var i = 0; i < positions.length; i+=9) {
        pack_vertices(output, fn(unpack_vertices(positions, i, 3), i));
    }
    return output;
}

// triangle: unpacked vertices [[x, y, z], [x, y, z], [x, y, z]]
function flat_normal(triangle) {
    var a = triangle[0];
    var b = triangle[1];
    var c = triangle[2];
    var ab = vec3.create();
    var ac = vec3.create();
    var normal = vec3.create();
    vec3.sub(ab, b, a);
    vec3.sub(ac, c, a);
    vec3.cross(normal, ab, ac);
    vec3.normalize(normal, normal);
    return [normal, normal, normal];
}

function triangle_index(triangle, i) {
    return [[i],[i],[i]];
}

function op_translate(dx, dy, dz) {
    var identity = mat4.create();
    return mat4.translate(identity, identity, [dx, dy, dz]);
}
function op_rotate_x(angle) {
    var identity = mat4.create();
    return mat4.rotate(identity, identity, angle, [1, 0, 0]);
}
function op_rotate_y(angle) {
    var identity = mat4.create();
    return mat4.rotate(identity, identity, angle, [0, 1, 0]);
}
function op_rotate_z(angle) {
    var identity = mat4.create();
    return mat4.rotate(identity, identity, angle, [0, 0, 1]);
}
function op_scale(sx, sy, sz) {
    var identity = mat4.create();
    return mat4.scale(identity, identity, [sx, sy, sz]);
}

function matrix_str(mat) {
    return "[ " + mat[0] + " "
                + mat[1] + " "
                + mat[2] + " "
                + mat[3] + " | "
                + mat[4] + " "
                + mat[5] + " "
                + mat[6] + " "
                + mat[7] + " | "
                + mat[8] + " "
                + mat[9] + " "
                + mat[10] + " "
                + mat[11] + " | "
                + mat[12] + " "
                + mat[13] + " "
                + mat[14] + " "
                + mat[15] + "]";
}

function vector_str(vec) {
    var vec_3 = vec[3]||"";
    return "[ " + vec[0] + " "
                + vec[1] + " "
                + vec[2] + " "
                + vec_3 + " ]";
}

function extrude_geom(geom, cmd_list) {
    var base_paths;
    var transform = mat4.create();
    var previous_paths;
    for (var i = 0; i < cmd_list.length; ++i) {
        var item = cmd_list[i];
        if (item.transform) {
            mat4.multiply(transform, transform, item.transform);
        }
        if (item.apply) {
            var transformed_paths = transform_paths(base_paths, transform);
            if (previous_paths) {
                item.apply(geom, previous_paths, transformed_paths);
            }
            previous_paths = transformed_paths;
        }
        if (item.set_path) {
            base_paths = item.set_path(base_paths);
        }
        if (item.jump) {
            i = item.jump(i);
        }
    }
}

function create_geom_from_cmd_list(commands) {
    var geom = {}

    if (asset.positions) { geom.positions = []; }
    if (asset.normals) { geom.normals = []; }
    if (asset.uvs) { geom.uvs = []; }

    extrude_geom(geom, commands);

    var buffers = [];
    if (asset.positions) { buffers.push(make_vbo(POS, geom.positions)); }
    if (asset.normals) { buffers.push(make_vbo(NORMAL, geom.normals)); }
    if (asset.uvs) { buffers.push(make_vbo(UV, geom.uvs)); }

    geometries[name] = {
      buffers: buffers,
      mode: gl.TRIANGLES,
      vertex_count: geom.positions.length / 3
    };
}

// XXX - apply_extrusion
function apply_fn(geom, previous_rings, new_rings, triangle_fn, quad_fn) {
  previous_rings.forEach(
      function(prev_item, i) {
          //console.log(new_rings);
          join_rings(
            geom,
            prev_item,
            new_rings[i],
            triangle_fn,
            quad_fn
          );
      }
  );
}

function apply_fill(geom, ring) {
  var normal = [0, 1, 0];
  for (var i = 1; i < ring.length - 1; i++) {
      pack_vertices(geom.positions, [ring[0], ring[i], ring[i + 1]]);
      //pack_vertices(geom.normals, [normal, normal, normal]);
  }
}


function jump_if(pc, cond) {
    return function(i) { if (cond(i)) { return pc; } };
}

function transform_paths(path_array, transform) {
    var out_array = [];
    for (var i = 0; i < path_array.length; ++i) {
        var path = path_array[i];
        var new_path = [];
        for (var v = 0; v < path.length; ++v) {
            var vertex = vec3.fromValues(
                path[v][0],
                path[v][1],
                path[v][2]
            );
            vec3.transformMat4(vertex, vertex, transform);
            new_path.push(vertex);
        }
        out_array.push(new_path);
    }
    return out_array;
}

function uv_buffer(u1, v1, u2, v2) {
  return [[
    u1, v1,
    u2, v1,
    u2, v2,
    u2, v2,
    u1, v2,
    u1, v1
  ]];
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
  return path.map(function(point)
  {
    return [point[0], y, -point[1]]
  })
}

function pack_vertices(to, v) {
    for (var i = 0; i<v.length; ++i) {
        for (var j = 0; j<v[i].length; ++j) {
            to.push(v[i][j]);
        }
    }
}

function join_rings(geom, r1, r2, triangle_fn, quad_fn) {
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
      pack_vertices(geom.positions, [r1[i], r1[next], r2[next], r2[next], r2[i], r1[i]]);

      var t1 = [r1[i], r1[next], r2[next]];
      var t2 = [r2[next], r2[i], r1[i]];
      if (geom.normals) {
        pack_vertices(geom.normals, flat_normal(t1));
        pack_vertices(geom.normals, flat_normal(t2));
      }
      if (triangle_fn) {
        triangle_fn(t1);
        triangle_fn(t2);
      } 
      if (quad_fn) {
        quad_fn([r2[i], r2[next], r1[next], r1[i]]);
      }
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

function tangent(v) {
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

function shrink_path(path, amount, z, use_subdiv, disp) {
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
        var displacement;
        //if(disp)
        //  console.log("on a disp=" + disp);
        displacement = disp || [0,0];
        // avoid shrinking too much
        if (vec2.distance(pa, pb) < amount*(1+pa.subdiv*use_subdiv*2)) {
            return deep_clone(path);
        }
        var pa_sub = pa.subdiv || 0;
        var px_sub = px.subdiv || 0;
        var na = _vec2_scale(tangent(_vector_2d(pa, px)), amount * (1+pa_sub*use_subdiv));
        var nb = _vec2_scale(tangent(_vector_2d(px, pb)), amount * (1+px_sub*use_subdiv));

        vec2.add(pna, pa, na);
        vec2.add(pnb, pb, nb);
        vec2.add(pnxa, px, na);
        vec2.add(pnxb, px, nb);

        var inter = lines_intersection_2d(pna, pnxa, pnxb, pnb );

        // If inter is null (pa, px and pb are aligned)
        inter = inter || [pnxa[0], pnxa[1]];
        inter = vec2.add(inter, inter, displacement);
        inter.subdiv = path[i].subdiv;
        new_path.push(inter);
    }

    var old_segment = vec2.create();
    var new_segment = vec2.create();
    for (var i = 0; i < path_length; ++i) {
        vec2.subtract(old_segment, path[(i+1)%path_length], path[i]);
        vec2.subtract(new_segment, new_path[(i+1)%path_length], new_path[i]);

        if (vec2.dot(old_segment, new_segment) < 0) {
            return null;
        }
    }
    return new_path;
}

//  Example:
//
//  fill_convex_ring(ctx, ring, (triangle) => {
//      pack_vertices(ctx.uv, top_uv);
//  });
//
// fn takes a triangle as parameter and must output an array of 3 attributes
// ex: [[u,v], [u,v], [u,v]]
function fill_convex_ring(geom, ring, fn) {
  for (var i = 1; i < ring.length - 1; i++) {
      var triangle = [ring[0], ring[i], ring[i + 1]];
      pack_vertices(geom.positions, triangle);
      if (geom.normals) {
        pack_vertices(geom.normals, flat_normal(triangle));
      }
      fn && fn(triangle, i);
  }
}

function circle_path(center, radius, n_points) {
    var path = []
    for (i = 0; i < n_points; ++i) {
        path.push([
            center[0] + -M.cos(i/n_points * 2 * M.PI) * radius,
            center[1] + M.sin(i/n_points * 2 * M.PI) * radius
        ]);
    }
    return path;
}

function circle_path_vec3(center, radius, n_points) {
    var path = [] 
    for (i = 0; i < n_points; ++i) {
        path.push([
            center[0] + -M.cos(i/n_points * 2 * M.PI) * radius,
            center[1],
            center[2] + M.sin(i/n_points * 2 * M.PI) * radius
        ]);
    }
    return path;
}


