var fs = require('fs');

function last(array) { return array[array.length - 1]; }

function export_pass(pass) {
    console.log("{");

    export_enabled(pass);
    export_render_to(pass);
    export_texture_inputs(pass);
    export_depth_test(pass);
    export_clear(pass);
    export_scene(pass);
    export_geometry(pass);
    export_program(pass);
    export_local_unifroms(pass);
    console.log("},");
}

function export_local_unifroms(pass) {
    if (!pass.uniforms) {
        return;
    }

    console.log("uniforms: [");
    for (var i = 0; i < pass.uniforms.length; ++i) {
        var uniform = pass.uniforms[i];
        console.log("{ name: '"+uniform.name+"', ");
        if (uniform.track) {
            console.log("track: '"+uniform.track+"',");
        }
        if (uniform.value) {
            console.log("value: ", uniform.value, ",");
        }
        console.log("},");
    }
    console.log("],");
}

function export_enabled(pass) {
    if (!pass.enabled) {
        return;
    }

    console.log("enabled: '"+pass.enabled+"',");
}

function export_render_to(pass) {
    if (!pass.render_to) {
        return;
    }

    console.log('render_to: "'+pass.render_to+'",');
}

function export_texture_inputs(pass) {
    if (!pass.texture_inputs) {
        return;
    }

    console.log("texture_inputs: [");
    for (var i in pass.texture_inputs) {
        console.log("textures."+pass.texture_inputs[i]+",");
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
    if (pass.depth_test == undefined) {
        return;
    }

    console.log("depth_test: ", pass.depth_test, ",");
}

function export_geometry(pass) {
    if (pass.geometry == undefined) {
        return;
    }

    console.log("geometry: [");

    for (var i = 0; i < pass.geometry.length; ++i) {
        var descriptor = pass.geometry[i];
        // descritptor is an array of the form ["name", instance_count]
        // we export it in the form [geometries.name, instance_count]
        // instance_count is optional
        var instance_count = descriptor[1];
        var name = descriptor[0];
        console.log("[geometries."+name, instance_count ? ", "+instance_count : "" ,"],");
    }

    console.log("],");
}

function export_program(pass) {
    if (pass.program) {
        console.log("program: programs."+pass.program+",");
    }
    if (pass.programs && pass.select_program) {
        console.log("programs: [");
        for (var i = 0; i < pass.programs.length; ++i) {
            console.log("programs."+pass.programs[i]+",");
        }
        console.log("],");
        console.log("select_program: '"+pass.select_program+"',");
    }
}

function export_scene(pass) {
    if (pass.scene == undefined) {
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
            console.log("{ geometry: geometries."+obj.geometry+",");
            // TODO[nical]
            //export_uniforms(obj.uniforms);
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
            console.log("var rg_targets = {}");
            console.log("function load_render_graph() {");
            for (var tex_name in asset.textures) {
                var desc = asset.textures[tex_name];
                console.log(
                    'textures.'+tex_name+' = create_texture(',
                    desc.width || 0, ",",
                    desc.height || 0, ",",
                    desc.format || 0, ",",
                    "0, ",
                    desc.allow_repeat || 0, ",",
                    desc.linear_filtering || 0, ",",
                    desc.mipmaps || 0, ",",
                    desc.float_texture || 0,
                    ");"
                );
            };
            for (var target_name in asset.render_targets) {
                var desc = asset.render_targets[target_name];
                console.log(
                    "rg_targets['"+target_name+"'] = create_render_target({",
                        desc.color ? 'color: textures.'+ desc.color+',' : "/*no color*/",
                        desc.depth ? 'depth: textures.'+ desc.depth+',' : "/*no depth*/",
                    "});"
                );
            }

            console.log("render_passes = [");
            asset.render_passes.forEach(export_pass);
            console.log("]");
            console.log("engine.render = render_rg;");
            console.log("}");
        });
    })(file);
}

