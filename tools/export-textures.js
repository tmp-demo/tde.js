var fs = require('fs');

function last(array) { return array[array.length - 1]; }

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
                case "empty": {
                    // TODO[minification], we don't need to pass the last N params
                    // if they are undefined.
                    console.log(
                        'textures.'+asset_name+' = create_texture(',
                        asset.width || undefined, SEP,
                        asset.height || undefined, SEP,
                        asset.format || undefined, SEP,
                        "0, ",
                        asset.allow_repeat || undefined, SEP,
                        asset.linear_filtering || undefined, SEP,
                        asset.mipmaps || undefined, SEP,
                        asset.float_texture || undefined,
                        ");"
                    );
                    break;
                }
                case "text": {
                    for (var t = 0; t < asset.data.length; ++t) {
						var item = asset.data[t];
                        console.log(
                            "textures.%s = %s(%d, %s);",
							JSON.stringify(item.id),
							(asset.vertical || item.vertical) ? "create_vertical_text_texture" : "create_text_texture",
							item.size,
							JSON.stringify(item.text)
                        );
                    }
                    break;
                }
                case "js": {
                    console.log("var generator = ", asset.generator.toString());
                    console.log('textures.'+asset_name+' = generator();');
                    break
                }
            }
        });
    })(file);
}