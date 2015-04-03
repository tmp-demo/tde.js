var fs = require("fs")
var exec = require("child_process").exec
var path = require("path")
var os = require("os")

if (process.argv.length < 4) {
    console.log("Usage: node deflate-7z.js <input file> <output file>")
    process.exit(1)
}

var tmpPath = path.join(os.tmpdir(), "tmp7zipoutput.zip")
exec("tools\\7z.exe -mx9 a " + tmpPath + " " + process.argv[2], function(err, stdout, stderr) {
    if (err) throw err
    console.log(stdout)
    
    // load zip file, skip header and extract only the deflated part
    var zipData = fs.readFileSync(tmpPath)
    var fixedHeaderLength = 0x1e
    var additionalHeaderLength = zipData.readUInt16LE(0x1a) /* file name length */ + zipData.readUInt16LE(0x1c) /* extra section length */
    var compressedFileSize = zipData.readUInt32LE(0x12)

    var dataStart = fixedHeaderLength + additionalHeaderLength
    var dataEnd = dataStart + compressedFileSize
    var data = zipData.slice(dataStart, dataEnd)
    var zlibHeader = new Buffer([0x78, 0xda])
    
    fs.writeFileSync(process.argv[3], Buffer.concat([zlibHeader, data]))
})
