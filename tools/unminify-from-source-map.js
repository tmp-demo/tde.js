var fs = require("fs");
var falafel = require("falafel");

var sourceMap = JSON.parse(fs.readFileSync(process.argv[2]).toString("utf8"))
var minifiedSource = fs.readFileSync(sourceMap.file).toString("utf8")
var sourceMapConsumer = new (require('source-map').SourceMapConsumer)(sourceMap);

// this bit was taken from the maximize source code (https://github.com/txase/maximize/blob/master/maximize.js), written by Chase Douglas
var unminifiedSource = falafel(minifiedSource, {loc: true}, function(node) {
  var orig;
  if (node.id) {
    orig = sourceMapConsumer.originalPositionFor({line: node.id.loc.start.line, column: node.id.loc.start.column});
    if (orig.name)
      node.id.update(orig.name);
  } else if (node.type === 'Identifier') {
    orig = sourceMapConsumer.originalPositionFor({line: node.loc.start.line, column: node.loc.start.column});
    if (orig.name)
      node.update(orig.name);
  }
}).toString("utf8")

var beautified = require("js-beautify")(unminifiedSource)
console.log(beautified)
