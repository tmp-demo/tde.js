var fs = require('fs');

function last(array) { return array[array.length - 1]; }

// If someone writes mode: gl.TRIANGLES ina geometry file without quotes, this
// makes thw script not choke on an undefined variable (gl) and spit out the
// expected code.
var gl = {
    TRIANGLE_STRIP: "gl.TRIANGLE_STRIP",
    TRIANGLE_FAN: "gl.TRIANGLE_FAN",
    TRIANGLES: "gl.TRIANGLES",
    POINTS: "gl.POINTS",
    LINES: "gl.LINES",
    LINE_STRIP: "gl.LINE_STRIP",
    LINE_LOOP: "gl.LINE_LOOP"
}

// TODO this is kinda yucks. If the function is not defined then either thos script
// fails or we have to make every expression and function in a command list a string
// and go through the hassle of evaluating them.
function op_circle_path_vec3() {}
function op_translate(x, y, z) { return "op_translate("+x+", "+y+", "+z+")" }
function op_rotate_x(angle) { return "op_rotate_x("+angle+")" }
function op_rotate_y(angle) { return "op_rotate_y("+angle+")" }
function op_rotate_z(angle) { return "op_rotate_z("+angle+")" }
function op_scale(sx, sy, sz) { return "op_scale("+sx+", "+sy+", "+sz+")" }
var apply_fn = "apply_fn";

// load the .tex assets passed as parameters and generate some code in stdout
for (var i = 2; i < process.argv.length; ++i) {
    var file = { index: i, name: process.argv[i] };
    (function(file) {
        fs.readFile(file.name, function(err, asset) {
            file_name = last(file.name.split('/')).split('.');
            asset = eval("___ = "+asset.toString());
            var asset_name = file_name[0];
            var SEP = ", "
            switch (asset.type) {
                case "buffers": {
                    console.log('geometries["'+asset_name+'"] = {');
                    console.log("  buffers: [")
                    if (asset.positions != undefined) {
                      console.log("     make_vbo(POS,", JSON.stringify(asset.positions), ")");
                    }
                    if (asset.normals != undefined) {
                      console.log("   , make_vbo(NORMAL,", JSON.stringify(asset.normals), ")");
                    }
                    if (asset.uvs != undefined) {
                      console.log("   , make_vbo(UV,", JSON.stringify(asset.uvs), ")");
                    }
                    if (asset.colors != undefined) {
                      console.log("   , make_vbo(COLOR,", JSON.stringify(asset.colors), ")");
                    }
                    console.log("  ],");
                    console.log("  mode:", asset.mode, ",");
                    console.log("  vertex_count:", asset.vertex_count);
                    console.log("};");
                    break;
                }
                case "generated": {
                    console.log('geometries["'+asset_name+'"] = create_geom_from_cmd_list([');
                    for (var cmd = 0; cmd < asset.commands.length; ++cmd) {
                        console.log("{")
                        var command = asset.commands[cmd];
                        if (command.transform) { console.log("transform: ", command.transform); }
                        if (command.apply) { console.log("apply: ", command.apply); }
                        if (command.set_path) { console.log("set_path: ", command.set_path.toString()); }
                        if (cmd == asset.commands.length - 1) {
                            console.log("}");
                        } else {
                            console.log("},");
                        }
                    }
                    console.log(']);');
                    break;
                }
                case "js": {
                    console.log("var generator = ", asset.generator.toString());
                    console.log('geometries["'+asset_name+'"] = generator();');
                    break
                }
            }
        });
    })(file);
}