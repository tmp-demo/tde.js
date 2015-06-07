var fs = require('fs');

function last(array) { return array[array.length - 1]; }

// load the .tex assets passed as parameters and generate some code in stdout
for (var i = 2; i < process.argv.length; ++i) {
    var file = { index: i, name: process.argv[i] };
    (function(file) {
        fs.readFile(file.name, function(err, asset) {
            file_name = last(file.name.split('/')).split('.');
            var asset_name = file_name[0];
            console.log("var ", asset_name, "= {}");
            console.log(asset.toString());
        });
    })(file);
}