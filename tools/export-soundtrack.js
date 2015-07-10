var fs = require('fs');

fs.readFile(process.argv[2], function(err, asset) {
    if (err) throw err
    
    var snd = JSON.parse(asset);

    console.log("function snd_init() {");

    if (snd.type == "streaming") {
        console.log("snd = SNDStreaming('" + snd.path + "', " + snd.bpm + ");")
    } else {
        console.log("snd = new SND();")
    }

    console.log("}");
});
