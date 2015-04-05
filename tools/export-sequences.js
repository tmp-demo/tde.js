var fs = require('fs');

function last(array) { return array[array.length - 1]; }

function export_clip(clip) {
    console.log("{");
    if (clip.start != undefined) {
        console.log("start: ", clip.start,",");
    }
    if (clip.duration != undefined) {
        console.log("duration: ", clip.duration, ",");
    }
    var animation = clip.animation;
    if (animation != undefined) {
        if (typeof animation == "string") {
            console.log("animation: function(t) { return "+animation+"},");
        } else {
            var key_frames = animation;
            console.log("animation: [");
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

function export_track(track_name, track) {
    console.log("'"+track_name+"': [");
    for (var c in track) {
        export_clip(track[c]);
    }
    console.log("],");
}


// load the .seq assets passed as parameters and generate some code in stdout
for (var i = 2; i < process.argv.length; ++i) {
    var file = { index: i, name: process.argv[i] };
    (function(file) {
        fs.readFile(file.name, function(err, asset) {
            file_name = last(file.name.split('/')).split('.');
            var asset_name = file_name[0];
            asset = eval("___ = "+asset.toString());
            console.log("var sequence = {");
            for (var track_name in asset) {
                var track = asset[track_name];
                export_track(track_name, track);
            }
            console.log("}");
            console.log("");
            //console.log('var sequence = ', asset, ';');
        });
    })(file);
}

