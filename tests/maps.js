
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

function subdivision_rec(paths, num_subdivs) {
    var sub_paths = [];
    for (var i in paths) {
        var sub = subdivision(paths[i], num_subdivs)
        if (!sub) {
            sub_paths.push(paths[i]);
        }
        else {
            //stretch_path(sub[0], -2.0);
            //stretch_path(sub[1], -2.0);
            sub_paths.push(sub[0]);
            sub_paths.push(sub[1]);
        }
    }
    if (num_subdivs == 1) {
        return sub_paths;
    }
    return subdivision_rec(sub_paths, num_subdivs -1);
}

MIN_PERIMETER = 200;

function subdivision(path, sub_id) {
    var path_length = path.length;

    var a1; // = rand_int(path_length);
    var i = 0;
    var maxd = 0;
    var perimeter = 0;
    for (var i = 0; i < path_length; ++i) {
        var d = vec2.distance(path[i], path[mod(i+1, path_length)]);
        if (d > maxd) {
            maxd = d;
            a1 = i;
        }
        perimeter += d;
    }
    //console.log(" perimeter: " + perimeter);
    if (perimeter < MIN_PERIMETER) { return null; }

    var a2 = mod((a1+1), path_length);
    var b1, b2, p_a3, p_b3;

    var guard = 0;
    do {

        b1 = rand_int(path_length);
        if (a1 == b1) { continue; }

        if (guard++ > 10) { break; }
        if (a1 == b1 + 1) { continue; }
        //if (a1 == b1 - 1) { continue; }

        b2 = mod((b1+1), path_length);

        // TODO: this skews the distribution towards 0.5 - make it less verbose
        var f1 = 0.5 + (0.5 - Math.abs(Math.random() - 0.5)) * 0.2;
        var f2 = 0.5 + (0.5 - Math.abs(Math.random() - 0.5)) * 0.2;

        p_a3_1 = { '0': path[a1][0]*f1 + path[a2][0]*(1.0-f1), '1': path[a1][1]*f1 + path[a2][1]*(1-f1), subdiv: path[a1][1].subdiv};
        p_b3_1 = { '0': path[b1][0]*f2 + path[b2][0]*(1.0-f2), '1': path[b1][1]*f2 + path[b2][1]*(1-f2), subdiv: path[a1][1].subdiv};

        p_a3_2 = { '0': path[a1][0]*f1 + path[a2][0]*(1.0-f1), '1': path[a1][1]*f1 + path[a2][1]*(1-f1), subdiv: path[a1][1].subdiv - 1};
        p_b3_2 = { '0': path[b1][0]*f2 + path[b2][0]*(1.0-f2), '1': path[b1][1]*f2 + path[b2][1]*(1-f2), subdiv: path[a1][1].subdiv - 1};

        //var la = vec2.distance(path[a1], path[a2]);
        //var lb = vec2.distance(path[b1], path[b2]);
        //var l3 = vec2.distance(p_b3, p_a3);
        //var threshold = 16;
        //console.log("la "+ la+ " lb "+ lb+ " l3 "+ l3);
        //if (l3/la > threshold || la/l3 > threshold || l3/lb > threshold || lb/l3 > threshold) {
        //    console.log("bwaaaaaaah");
        //    continue;
        //}
        break;
    } while (1);

    var path1 = [p_a3_1, p_b3_2]
    for (var i = b2; i != a2; i = mod((i+1), path_length)) {
        path1.push(path[i]);
    }

    var path2 = [p_a3_2, p_b3_1]
    for (var i = b1; i != a1; i = mod((i-1), path_length)) {
        path2.push(path[i]);
    }

    return [path1, path2];
}

function road_shrink(path, index, amount) {

    // pb2 (2)         (-1) pa1
    //  \ (1)          (0) /
    //   pb3-------------pa3
    //    \              /
    //     pb1         pa2

    var index_plus_one = mod(index+1, path.length);
    var index_plus_two = mod(index+2, path.length);
    var index_minus_one = mod(index-1, path.length);

    var pa3 = path[index];
    var pb3 = path[index_plus_one];

    var d_b3a3 = vec2.substract([], pa3, pb3);
    vec2.normalize(d_b3a3, d_b3a3);

    var pb2 = path[index_plus_two];

    var n = [d_b3a3[1], -d_b3a3[0]];

    var b3b2 = vec2.substract([], pb2, pb3);
    var dot = dot(b3b2, d_b3a3);

    var b3x = [
        b3[0] = dot * d_b3a3[0],
        b3[1] = dot * d_b3a3[1]
    ];

    xb2 = vec2.distance(b3x, b2);



    n[0] *= amount;
    n[1] *= amount;
    var b3b2 = vec2.substract([], path[index_plus_two]);
    if (vec2.dot(n, b3b2) < 0) {
        n[0] *= -1;
        n[1] *= -1;
    }


}

function stretch_path(path, amount) {
    var center = [0.0, 0.0];
    for (var p in path) {
        center[0] += path[p][0] / path.length;
        center[1] += path[p][1] / path.length;
    }

    for (var p in path) {
        var v = [path[p][0] - center[0], path[p][1]-center[1]];
        var d = vec2.length(v);
        path[p][0] += v[0] * amount / d;
        path[p][1] += v[1] * amount / d;
    }
}

function draw_path(path) {
    ctx.fillStyle = 'rgb(230, 230, 230)';
    ctx.strokeStyle = null;

    ctx.beginPath();
    ctx.moveTo(path[0][0], path[0][1])
    for (var i in path) {
        ctx.lineTo(path[i][0], path[i][1]);
    }
    ctx.closePath();
    ctx.fill();

    for (var i = 0; i < path.length; ++i) {
        var subdiv = path[i].subdiv*10;
        console.log(" -- subdiv "+ subdiv);
        ctx.strokeStyle = 'rgb('+subdiv+',0,0)';
        var i2 = mod(i, path.length);
        //ctx.beginPath();
        ctx.moveTo(path[i][0],  path[i][1]);
        ctx.lineTo(path[i2][0], path[i2][1]);
        //ctx.closePath();
        ctx.stroke();
    }
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
        draw_path(paths[i]);
    }
}

function queue() {
//window.requestAnimationFrame(loop);
}
