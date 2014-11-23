
// path: [0: , 1: , subdiv: }]

var canvas;
var ctx;
var paths = [[
        { '0': 50.0,  '1': 50.0,  subdiv: 0 },
        { '0': 550.0, '1': 50.0,  subdiv: 0 },
        { '0': 550.0, '1': 550.0, subdiv: 0 },
        { '0': 150.0, '1': 350.0, subdiv: 0 },
        { '0': 25.0,  '1': 175.0, subdiv: 0 }
    ]
];


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

function intersection(a1, a2, b1, b2) {
    var det = (a1[0]-a2[0])*(b1[1]-b2[1]) - (a1[1]-a2[1])*(b1[0]-b2[0]);
    if (det*det < 0.0000001) { return null }
    var a = (a1[0]*a2[1]- a1[1]*a2[0]);
    var b = (b1[0]*b2[1]- b1[1]*b2[0]);
    return [
        (a * (b1[0] - b2[0]) - b * (a1[0] - a2[0])) / det,
        (a * (b1[1] - b2[1]) - b * (a1[1] - a2[1])) / det
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

        var inter = intersection(
            _vec2_add(pa, na),
            _vec2_add(px, na),
            _vec2_add(px, nb),
            _vec2_add(pb, nb)
        );

        if (inter !== null) {
            inter.subdiv = path[i].subdiv;
            new_path.push(inter);
        }
    }
    return new_path;
}

function subdivision_rec(paths, num_subdivs, sub_id) {
    if (sub_id === undefined) { sub_id = 0 }
    var sub_paths = [];
    for (var i in paths) {
        var sub = subdivision(paths[i], sub_id)
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
    return subdivision_rec(sub_paths, num_subdivs - 1, sub_id + 1);
}

// TODO make this show in the editor: it defines how the min size of city blocks
MIN_PERIMETER = 400;
EXTRUSION_FACTOR = 2;
MIN_SEGMENT = 3* EXTRUSION_FACTOR;

function subdivision(path, sub_id) {
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

        p_a3_1 = { '0': path[a1][0]*f1 + path[a2][0]*(1.0-f1), '1': path[a1][1]*f1 + path[a2][1]*(1-f1), subdiv: sub_id};
        p_a3_2 = { '0': path[a1][0]*f1 + path[a2][0]*(1.0-f1), '1': path[a1][1]*f1 + path[a2][1]*(1-f1), subdiv: path[a1].subdiv};

        p_b3_1 = { '0': path[b1][0]*f2 + path[b2][0]*(1.0-f2), '1': path[b1][1]*f2 + path[b2][1]*(1-f2), subdiv: sub_id};
        p_b3_2 = { '0': path[b1][0]*f2 + path[b2][0]*(1.0-f2), '1': path[b1][1]*f2 + path[b2][1]*(1-f2), subdiv: path[b1].subdiv};

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
        accum += path.length();
    }
    return accum;
}

//function stretch_path(path, amount) {
//    var center = [0.0, 0.0];
//    for (var p in path) {
//        center[0] += path[p][0] / path.length;
//        center[1] += path[p][1] / path.length;
//    }
//
//    for (var p in path) {
//        var v = [path[p][0] - center[0], path[p][1]-center[1]];
//        var d = vec2.length(v);
//        path[p][0] += v[0] * amount / d;
//        path[p][1] += v[1] * amount / d;
//    }
//}

function draw_path(path) {
    ctx.fillStyle = 'rgb(230, 230, 230)';
    ctx.beginPath();
    ctx.moveTo(path[0][0], path[0][1])
    for (var i in path) {
        ctx.lineTo(path[i][0], path[i][1]);
    }
    ctx.closePath();
    ctx.fill();

    for (var i in path) {
        ctx.strokeStyle = 'rgb('+(255 -path[mod(i-1, path.length)].subdiv*30)+', 0, 0)';
        console.log("subdiv: " + path[mod(i-1, path.length)].subdiv);
        ctx.beginPath();
        ctx.moveTo(
            path[i][0],
            path[i][1]
        );
        ctx.lineTo(
            path[mod(i-1, path.length)][0],
            path[mod(i-1, path.length)][1]
        );
        ctx.stroke();
        ctx.closePath();
    }

    //console.log(path);
}

function on_load() {
    canvas = document.querySelector('canvas');
    ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    console.log("start")
    loop();
}

function loop() {
    clear();
    update();
    draw();
    queue();
}

function clear() {
    console.log("clear")
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#FFF";
    ctx.fillRect(0, 0, w, h);
}

function update() {
// stub
}

function draw() {
    paths = subdivision_rec(paths, 20);

    for (var i in paths) {
        //ctx.fillStyle = '#'+Math.floor(Math.random()*16777215).toString(16);
        //ctx.fillStyle = 'rgb(230, 230, 230)';
        //ctx.strokeStyle = '#FFF';
        draw_path(extrude_path(paths[i], EXTRUSION_FACTOR));
    }
}

function queue() {
//window.requestAnimationFrame(loop);
}
