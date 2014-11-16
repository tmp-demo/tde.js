var fs = require('fs');

var sourceMap = JSON.parse(fs.readFileSync(process.argv[2]).toString("utf8"))
var minifiedSource = fs.readFileSync(sourceMap.file).toString("utf8")
var sourceMapConsumer = new (require('source-map').SourceMapConsumer)(sourceMap);

/*var lines = minifiedSource.split("\n")
for (var l = 0; l < 1; l++) {
  for (var c = 0; c < lines[l].length; c++) {
    var originalPosition = sourceMapConsumer.originalPositionFor({line: 1, column: c})
    console.log(c, originalPosition)
  }
}
*/

sourceMapConsumer.eachMapping(function(mapping) {
  console.log(mapping)
})
