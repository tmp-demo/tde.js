var fs = require("fs")
var crc32 = require("buffer-crc32")
var zlib = require("zlib")

if (process.argv.length < 4) {
    console.log("Usage: node png.js <js input> <png output>")
    process.exit(1)
}

//var js = "alert('plop!')"
//var imageData = new Buffer([0x50, 0xff, 0x0, 0x80])

var js = fs.readFileSync(process.argv[2])
var imageData = new Buffer(js)
var filteredImageData = new Buffer(imageData.length)

// no filtering
imageData.copy(filteredImageData)

// delta filter
/*filteredImageData[0] = imageData[0]
for (var i = 1; i < imageData.length; i++)
    filteredImageData[i] = imageData[i] - imageData[i - 1]*/

// first working version
var bootstrap = "<canvas id=C><img src=# onload=$=C.width=" + filteredImageData.length + ";c=C.getContext('2d');c.drawImage(this,0,0);s='';for(i=0;i<$;i++)s+=String.fromCharCode(c.getImageData(i,0,1,1).data[0]);eval(s)>"

var width = filteredImageData.length
var height = 1

function makeChunk(signature, data, appendCRC) {
    var chunk = Buffer.concat([new Buffer(signature, "ascii"), data])
    
    if (appendCRC) {
        var crc = crc32.unsigned(chunk)
        var crcBuf = new Buffer(4)
        crcBuf.writeUInt32BE(crc, 0)
        chunk = Buffer.concat([chunk, crcBuf])
    }
    
    var lengthBuf = new Buffer(4)
    lengthBuf.writeUInt32BE(data.length, 0)
    chunk = Buffer.concat([lengthBuf, chunk])
    
    return chunk
}

var header = new Buffer([/* %PNG */ 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

var ihdr = new Buffer(13)
ihdr.writeUInt32BE(width, 0)
ihdr.writeUInt32BE(height, 4)
ihdr.writeUInt8(8 /* bit depth */, 8)
ihdr.writeUInt8(0 /* grayscale */, 9)
ihdr.writeUInt8(0 /* compression method (deflate) */, 10)
ihdr.writeUInt8(0 /* filter method */, 11)
ihdr.writeUInt8(0 /* no interlace */, 12)

var idat = Buffer.concat([new Buffer([0x0]), filteredImageData])
var options = {
    level: zlib.Z_BEST_COMPRESSION,
    windowBits: 15
}
zlib.deflate(idat, options, function(err, idat)
{
    if (err) throw err
    
    var ihdrChunk = makeChunk("IHDR", ihdr, true)
    var idatChunk = makeChunk("IDAT", idat, true)
    var png = Buffer.concat([header, ihdrChunk, idatChunk, new Buffer(bootstrap)])

    fs.writeFile(process.argv[3], png, function(err) {
        if (err) throw err
    })
})
