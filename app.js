var express = require("express")
var bodyParser = require('body-parser')
var http = require("http")
var git = require("gift")
var fs = require("fs")
var exec = require("child_process").exec

var app = express()
var server = http.createServer(app)

var dataRoot = __dirname + "/data/"

var sockets = []
function broadcast(name, data)
{
	for (var i = 0; i < sockets.length; i++)
	{
		sockets[i].emit(name, data)
	}
}

app.use(bodyParser.json())

app.get("/data/projects", function(req, res)
{
	fs.readdir(dataRoot, function(err, files)
	{
		if (err) throw err
		
		var folders = files.filter(function(file)
		{
			var stats = fs.statSync(dataRoot + file)
			return stats.isDirectory()
		})
		
		res.json(folders)
	})
})

app.post("/data/projects", function(req, res)
{
	var projectName = req.body.name
	
	if (/^[-\w]+$/.test(projectName) == false)
	{
		res.type("text/plain")
		res.send(403, "Project names should match /^[-\\w]+$/")
		return
	}
	
	var projectFolder = dataRoot + projectName
	fs.mkdir(projectFolder, function(err)
	{
		if (err)
		{
			res.type("text/plain")
			res.send(403, "mkdir failed: " + err.message)
		}
		else
		{
			git.init(projectFolder, function(err, repo)
			{
				if (err)
				{
					res.type("text/plain")
					res.send(500, "git init failed: " + err.message)
				}
				else
				{
					res.type("text/plain")
					res.send(201, "Project created")
					
					broadcast("projectListChanged")
				}
			})
		}
	})
})

app.get("/data/project/:projectId/assets", function(req, res)
{
	var projectName = req.params.projectId
	
	if (/^[-\w]+$/.test(projectName) == false)
	{
		res.type("text/plain")
		res.send(403, "Project names should match /^[-\\w]+$/")
		return
	}
	
	fs.readdir(dataRoot + projectName, function(err, files)
	{
		if (err) throw err
		
		var assets = files.filter(function(file)
		{
			var stats = fs.statSync(dataRoot + projectName + "/" + file)
			return stats.isFile()
		})
		
		res.json(assets.map(function(filename)
		{
			var parts = filename.split(".")
			return {name: parts[0], type: parts[1]}
		}))
	})
})

app.post("/data/project/:projectId/assets", function(req, res)
{
	var projectName = req.params.projectId
	var assetName = req.body.name
	var assetType = req.body.type
	
	if (/^[-\w]+$/.test(projectName) == false)
	{
		res.type("text/plain")
		res.send(403, "Project names should match /^[-\\w]+$/")
		return
	}
	
	if (/^[-\w]+$/.test(assetName) == false)
	{
		res.type("text/plain")
		res.send(403, "Asset names should match /^[-\\w]+$/")
		return
	}
	
	var supportedAssetTypes = ["texture", "model", "sequence", "music"]
	if (supportedAssetTypes.indexOf(assetType) == -1)
	{
		res.type("text/plain")
		res.send(403, "Asset type unsupported. Possible type: " + supportedAssetTypes)
		return
	}
	
	var templatePath = __dirname + "/data_templates/" + assetType + ".json"
	var assetPath = dataRoot + projectName + "/" + assetName + "." + assetType
	
	fs.exists(assetPath, function(exists)
	{
		if (exists)
		{
			res.type("text/plain")
			res.send(403, "Asset already exists")
			return
		}
		else
		{
			fs.readFile(templatePath, function(err, templateData)
			{
				if (err) throw err
				
				fs.writeFile(assetPath, templateData, function(err)
				{
					if (err) throw err
					
					var repo = git(dataRoot + projectName)
					repo.add(assetName + "." + assetType, function(err)
					{
						if (err) throw err
						
						repo.commit("added new " + assetType, {author: "MrPlop <mr_plop@plop.net>"}, function(err)
						{
							if (err) throw err
							
							res.type("text/plain")
							res.send(200, "Asset created")
							
							broadcast("assetListChanged", {projectId: projectName})
						})
					})
				})
			})
		}
	})
})

app.get("/data/project/:projectId/asset/:assetId", function(req, res)
{
	var projectId = req.params.projectId
	var assetId = req.params.assetId
	
	if (/^[-\w]+$/.test(projectId) == false)
	{
		res.type("text/plain")
		res.send(403, "Project names should match /^[-\\w]+$/")
		return
	}
	
	if (/^[-\w.]+$/.test(assetId) == false)
	{
		res.type("text/plain")
		res.send(403, "Asset ID should match /^[-\\w]+$/")
		return
	}
	
	var assetPath = dataRoot + projectId + "/" + assetId
	fs.readFile(assetPath, function(err, assetData)
	{
		if (err) throw err
		
		res.type("application/json")
		res.send(200, assetData)
	})
})

app.get("/export/:projectId", function(req, res)
{
	var projectId = req.params.projectId
	
	var demoFilename = __dirname + "/export/demo.png.html"
	fs.unlink(demoFilename, function(err)
	{
		var command = __dirname + "/EXPORT.sh"
		
		// hack for windows debug (assumes cygwin is installed in c:\cygwin)
		if (process.platform == "win32")
			command = "c:/cygwin/bin/bash.exe --login -c \"cd '" + __dirname + "' && ./EXPORT.sh\""
		
		exec(command, function(err, stdout, stderr)
		{
			fs.exists(demoFilename, function(exists)
			{
				if (!exists)
				{
					res.type("text/plain")
					res.send(500, "== Export failed ==\n\nstdout:\n" + stdout + "\n\nstderr:\n" + stderr)
					return
				}
				
				res.type("text/html")
				fs.createReadStream(demoFilename).pipe(res)
			})
		})
	})
})

app.use(express.static(__dirname + "/public"))
app.use(express.static(__dirname + "/export/shaders"))

server.listen(8084)

var io = require("socket.io").listen(server)

io.sockets.on("connection", function(socket)
{
	sockets.push(socket)
	
	socket.on("disconnect", function()
	{
		sockets.splice(sockets.indexOf(socket), 1)
	})
})
