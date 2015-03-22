var fs = require('fs');

function last(array) { return array[array.length - 1]; }

function export_pass(pass) {
    console.log("{");

    export_render_to(pass);
    export_texture_inputs(pass);
    export_depth_test(pass);
    export_clear(pass);
    export_scene(pass);
    export_geometry(pass);
    export_program(pass);
    export_clips(pass);

    console.log("},");
}

function export_render_to(pass) {
    if (!pass.render_to) {
        return;
    }

    console.log("render_to: {");
    for (var target in pass.render_to) {
        console.log(target, ": '"+ pass.render_to[target] +"',");
    }
    console.log("},");
}

function export_texture_inputs(pass) {
    if (!pass.texture_inputs) {
        return;
    }

    console.log("texture_inputs: [");
    for (var i in pass.texture_inputs) {
        console.log("'"+pass.texture_inputs[i]+"',");
    }
    console.log("],")
}

function export_clear(pass) {
    if (!pass.clear) {
        return;
    }

    if (typeof pass.clear == "object") {
        console.log("clear: [", pass.clear.toString(), "],")
    } else {
        console.log("clear: "+pass.clear+",");
    }
}

function export_depth_test(pass) {
    if (!pass.depth_test) {
        return;
    }

    console.log("depth_test: ", pass.depth_test, ",");
}

function export_geometry(pass) {
    if (!pass.geometry) {
        return;
    }

    console.log("geometry: '"+pass.geometry+"',");
}

function export_program(pass) {
    if (!pass.program) {
        return;
    }

    console.log("program: '"+pass.program+"',");
}

function export_clips(pass) {
    if (!pass.clips) {
        return;
    }
    console.log("clips: [");
    for (var c in pass.clips) {
        var clip = pass.clips[c];
        export_clip(clip);
    }
    console.log("],");
}

function export_clip(clip) {
    if (!clip) {
        return;
    }

    console.log("{");
    console.log("start:", clip.start, ",");
    console.log("duration:", clip.duration, ",");
    export_uniforms(clip.uniforms);
    console.log("},");
}

function export_uniforms(uniforms) {
    if (!uniforms) {
        return;
    }
    console.log("uniforms: {");
    for (var name in uniforms) {
        var uniform = uniforms[name];
        if (typeof uniform == "string") {
            console.log("'"+name+"': function(t) { return "+uniform+"},");
        } else {
            var key_frames = uniform;
            console.log("'"+name+"': [");
            for (var f in key_frames) {
                var time = key_frames[f][0];
                var value = key_frames[f][1];
                console.log("[", time, ", [") // time
                for (var component in value) {
                    console.log(value[component].toString()+",");
                }
                console.log("]],");
            }
            console.log("],");
        }
    }
    console.log("},");
}

function export_scene(pass) {
    if (!pass.scene) {
        return;
    }

    if (typeof pass.scene == 'string') {
        // asset reference
        console.log("scene: '"+pass.scene+"',");
    } else {
        // inline scene
        console.log("scene: [");
        for (var o in pass.scene) {
            var obj = pass.scene[o];
            console.log("{ geometry: '"+obj.geometry+"',");
            export_uniforms(obj.uniforms);
            console.log("},")
        }
        console.log("],");
    }
}

// load the .seq assets passed as parameters and generate some code in stdout
for (var i = 2; i < process.argv.length; ++i) {
    var file = { index: i, name: process.argv[i] };
    (function(file) {
        fs.readFile(file.name, function(err, asset) {
            file_name = last(file.name.split('/')).split('.');
            var asset_name = file_name[0];
            asset = eval("___ = "+asset.toString());
            console.log("var sequence = [");
            for (var p in asset) {
                var pass = asset[p];
                export_pass(pass);
            }
            console.log("]");
            console.log("");
            //console.log('var sequence = ', asset, ';');
        });
    })(file);
}

