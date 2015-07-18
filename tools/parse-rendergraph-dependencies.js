var fs = require('fs');

function last(array) { return array[array.length - 1]; }

// load the .tex assets passed as parameters and generate some code in stdout
for (var i = 2; i < process.argv.length; ++i) {
    var file = { index: i, name: process.argv[i] };
    (function(file) {
        fs.readFile(file.name, function(err, asset) {
            var rg = eval("____ = " + asset)
            var programs = []
            rg.render_passes.forEach(function(pass) {
                if (pass.programs) {
                    for (var p = 0; p < pass.programs.length; ++p) {
                        var filename = pass.programs[p] + ".glsl"
                        if (programs.indexOf(filename) == -1) {
                            programs.push(filename)
                        }
                    }
                }
                if (pass.program) {
                    var filename = pass.program + ".glsl"
                    if (programs.indexOf(filename) == -1) {
                        programs.push(filename)
                    }
                }
            })
            console.log(programs.join(" "))
        });
    })(file);
}