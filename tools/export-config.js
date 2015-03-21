var fs = require('fs');

function last(array) { return array[array.length - 1]; }

// load the .config asset passed as parameters and generate some code in stdout
for (var i = 2; i < process.argv.length; ++i) {
    var file = { index: i, name: process.argv[i] };
    (function(file) {
        fs.readFile(file.name, function(err, asset) {
            file_name = last(file.name.split('/')).split('.');
            asset = eval("___ = "+asset.toString());
            var asset_name = file_name[0];
            var SEP = ", "

            console.log("/* @const */ var config = {");
            for (var f in asset.define) {
                console.log("/* @const */", f, ":", asset.define[f],",");
            }
            console.log("/* @const */EXPORT: true");
            console.log("}");
        });
    })(file);
}
