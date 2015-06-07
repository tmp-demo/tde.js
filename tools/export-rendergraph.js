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

    console.log("},");
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

    console.log("render_to: {");
    for (var target in pass.render_to) {
        console.log(target, ": textures."+ pass.render_to[target] +",");
    }
    console.log("},");
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

    if (pass.instance_count != undefined) {
        console.log("instance_count: '"+pass.instance_count+"',");
    }
    console.log("geometry: geometries."+pass.geometry+",");
}

function export_program(pass) {
    if (pass.program == undefined) {
        return;
    }

    console.log("program: '"+pass.program+"',");
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
            console.log("var render_passes = [");
            asset.render_passes.forEach(export_pass);
            console.log("]");
            console.log("engine.render = render_rg;");
            console.log("");
            //console.log('var sequence = ', asset, ';');
        });
    })(file);
}

