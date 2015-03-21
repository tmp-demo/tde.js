var fs = require('fs');

function last(array) { return array[array.length - 1]; }

// load the .tex assets passed as parameters and generate some code in stdout
for (var i = 2; i < process.argv.length; ++i) {
    var file = { index: i, name: process.argv[i] };
    (function(file) {
        fs.readFile(file.name, function(err, asset) {
            var sequence = eval("____ = " + asset)
            var programs = []
            sequence.forEach(function(pass) {
                if (pass.program)
                    programs.push(pass.program + ".glsl")
            })
            console.log(programs.join(" "))
        });
    })(file);
}