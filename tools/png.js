var fs = require("fs")
var crc32 = require("buffer-crc32")
var zlib = require("zlib")

var MAX_CANVAS_WIDTH=2048

if (process.argv.length < 4) {
    console.log("Usage: node png.js <js input> <png output>")
    process.exit(1)
}

var js = new Buffer(fs.readFileSync(process.argv[2]))
//var js = new Buffer("var lipsum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam dapibus nec dui eget volutpat. Sed ac mollis nibh. Nam vulputate tincidunt nunc. Aliquam a justo lorem. Fusce gravida augue ac tortor commodo, eu venenatis neque egestas. Vestibulum scelerisque eu augue a rutrum. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Proin a gravida mauris.  Sed vitae laoreet elit. Suspendisse non risus neque. Integer facilisis congue maximus. Nulla facilisi. Sed lacus dui, mollis in tellus eu, interdum dictum est. Curabitur posuere risus ac semper elementum. Vestibulum imperdiet auctor gravida. Maecenas augue augue, sollicitudin vel risus sed, placerat tincidunt nibh. Donec ut urna finibus, ullamcorper lacus id, cursus justo.  Maecenas at urna ut ligula consequat mollis eu ac lorem. Maecenas condimentum ullamcorper quam. Nullam orci felis, viverra vel vulputate a, hendrerit id enim. Nulla ullamcorper turpis ut lorem sodales faucibus. Ut ultrices consectetur ullamcorper. Donec tincidunt metus libero, id hendrerit leo suscipit in. Pellentesque aliquet hendrerit odio id aliquet. Aliquam erat volutpat. Ut gravida fringilla massa, pellentesque interdum leo lacinia eleifend. Praesent convallis metus at augue congue consectetur. Donec porttitor in eros ac ultricies. Sed eleifend condimentum arcu aliquet pharetra. Suspendisse potenti. Nullam sed sapien eget odio commodo hendrerit.  Pellentesque quis eros in felis auctor sodales. In gravida nisl ac purus accumsan rhoncus. Etiam odio nisi, mattis in aliquet sed, consectetur nec tortor. Cras at nulla volutpat, ornare quam ac, suscipit nulla. Morbi in accumsan sapien. Pellentesque eleifend, leo dictum elementum dapibus, justo nisl ultricies eros, in hendrerit augue nibh vitae nulla. Vestibulum pharetra tincidunt ultricies. Nam ac libero nibh.  Sed at commodo ipsum, in elementum sem. Fusce varius suscipit enim, fringilla dictum orci accumsan quis. Fusce tincidunt odio pellentesque pretium fermentum. Maecenas sed risus sed odio mattis viverra. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam quam felis, dictum sed nulla a, pretium finibus nulla. Phasellus pulvinar dolor et sapien venenatis, a fermentum dui mattis. Sed vestibulum, turpis ac mollis lacinia, tellus augue hendrerit elit, sed molestie arcu diam eget lectus.  Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed massa neque, tempor quis ornare eu, semper ac lacus. Proin tempus bibendum consequat. Etiam tempus eu nunc at luctus. Pellentesque at dui et turpis dapibus suscipit. Mauris eu quam a sapien viverra aliquam eget vitae ante. Aenean eu ligula lorem.  Vestibulum molestie ipsum quis nibh porta, ac placerat magna sagittis. Aliquam vitae diam porta, semper nisl non, tempor ante. Nam nec pellentesque massa. Nullam varius purus ut ultricies fringilla. Ut efficitur turpis placerat, pretium lacus in, commodo ante. Pellentesque accumsan, urna a aliquam tincidunt, diam est gravida tellus, in auctor metus quam at enim. Aenean vitae interdum libero. Pellentesque id ultricies odio. Quisque in nisi porttitor, facilisis diam sed, tincidunt elit. Maecenas elit odio, cursus et volutpat sit amet, fermentum eu velit. Donec bibendum turpis in rutrum viverra. Nam ultrices magna nec nunc bibendum, eu pretium turpis pulvinar. Ut ornare nulla dolor, nec rhoncus lectus dapibus sed.  Aenean ut nunc vel quam auctor finibus. Cras sem nunc, convallis vitae nisi eu, vestibulum mattis mauris. Aliquam vel elit posuere, finibus risus eget, rhoncus eros. In fermentum tempor arcu nec mollis. Vestibulum ante odio, pellentesque non enim ut, sagittis convallis metus. Ut feugiat, lacus eu molestie facilisis, eros tortor convallis neque, sit amet luctus massa justo a massa. Donec sit amet lacus vehicula, rhoncus metus ac, sodales felis.  Donec sed tempor augue. Vestibulum est libero, pharetra sed mauris eget, malesuada posuere dolor. Nam pellentesque massa ac condimentum aliquet. In malesuada mollis bibendum. Aliquam et feugiat augue. Pellentesque sed nulla sit amet enim efficitur aliquet eget in enim. Curabitur pellentesque euismod est eget efficitur. Integer vel mauris commodo, scelerisque libero vitae, fermentum diam. Maecenas scelerisque nibh massa, a viverra felis vulputate ut. Nunc ornare ex neque, quis volutpat ipsum posuere at. Ut mollis odio velit, et maximus turpis ultricies et. In at magna ut tortor semper posuere sed sed metus. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Nam malesuada venenatis purus id sollicitudin. Quisque commodo quam eget aliquet efficitur.  Duis rhoncus urna libero, eu sollicitudin leo aliquet ut. In placerat urna elit, ac semper mi pellentesque quis. Cras eu est et justo vulputate blandit. Curabitur ut finibus arcu. Aliquam efficitur nisi eros, vel vulputate sapien malesuada euismod. Sed nisl quam volutpat.'; alert(lipsum);")

var width = MAX_CANVAS_WIDTH
var height = Math.ceil(js.length / width)

var scanlines = []
for (var row = 0; row < height; row++) {
    var lineData = js.slice(row * MAX_CANVAS_WIDTH, (row + 1) * MAX_CANVAS_WIDTH)
    var line = new Buffer(MAX_CANVAS_WIDTH + 1)
    for (var i = 0; i < line.length; i++)
        line[i] = 0x0
    lineData.copy(line, 1)
    scanlines.push(line)
}

var imageData = Buffer.concat(scanlines)

//var imageData = new Buffer([0x50, 0xff, 0x0, 0x80])
//var filteredImageData = new Buffer(imageData.length)


// no filtering
//imageData.copy(filteredImageData)

// delta filter
/*filteredImageData[0] = imageData[0]
for (var i = 1; i < imageData.length; i++)
    filteredImageData[i] = imageData[i] - imageData[i - 1]*/

// one-line png bootstrap
//var bootstrap = "><canvas id=C><img src=# onload=$=C.width=" + MAX_CANVAS_WIDTH + ";c=C.getContext('2d');c.drawImage(this,0,0);s='';for(y=0;y<" + height + ";y++)for(x=0;x<$;x++)s+=String.fromCharCode(c.getImageData(x,y,1,1).data[0]);console.log(s)>"

// multiline support
var bootstrap = "><canvas id=C><img src=# onload=$=C.width=" + MAX_CANVAS_WIDTH + ";c=C.getContext('2d');c.drawImage(this,0,0);d=c.getImageData(0,0,$," + height + ").data;s='';for(i=0;i<" + js.length * 4 + ";i+=4)s+=String.fromCharCode(d[i]);(1,eval)(s)>"

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

var idat = imageData
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
