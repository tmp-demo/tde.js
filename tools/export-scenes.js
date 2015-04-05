var fs = require('fs');

function last(array) { return array[array.length - 1]; }

// load the .scene assets passed as parameters and generate some code in stdout
for (var i = 2; i < process.argv.length; ++i) {
    var file = { index: i, name: process.argv[i] };
    (function(file) {
        fs.readFile(file.name, function(err, asset) {
            file_name = last(file.name.split('/')).split('.');
            var asset_name = file_name[0];
            if (asset == undefined) {
                return;
            }
            // TODO: rather than just output the asset, we can parse it and de-stringify
            // as much as possible to save space.
            console.log("scenes['"+asset_name+"'] = ", asset.toString());
        });
    })(file);
}
