var express = require("express")
var bodyParser = require("body-parser")
var errorHandler = require("errorhandler")
var http = require("http")

var app = express()
var server = http.createServer(app)

app.set("dataRoot", __dirname + "/data/")

app.use(bodyParser.json())

require("./project").init(app)
require("./asset").init(app)

app.use(express.static(__dirname + "/public"))
app.use(express.static(__dirname + "/export/shaders"))

app.use(errorHandler())

server.listen(8084)
