var git = require("gift")
var fs = require("fs")

module.exports.init = function(app)
{
	app.get("/data/project/:projectId/assets", function(req, res, next)
	{
		var projectName = req.params.projectId
		
		fs.readdir(app.get("dataRoot") + projectName, function(err, files)
		{
			if (err) return next(err)
			
			var assets = files.filter(function(file)
			{
				var stats = fs.statSync(app.get("dataRoot") + projectName + "/" + file)
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
		
		if (/^[-\w]+$/.test(assetName) == false)
		{
			return next(new Error("Asset names should match /^[-\\w]+$/"))
		}
		
		var supportedAssetTypes = ["texture", "model", "sequence", "music"]
		if (supportedAssetTypes.indexOf(assetType) == -1)
		{
			return next(new Error("Asset type unsupported. Possible type: " + supportedAssetTypes))
		}
		
		var templatePath = __dirname + "/data_templates/" + assetType + ".json"
		var assetPath = app.get("dataRoot") + projectName + "/" + assetName + "." + assetType
		
		fs.exists(assetPath, function(exists)
		{
			if (exists) return next(new Error("Asset already exists"))
			
			fs.readFile(templatePath, function(err, templateData)
			{
				if (err) next(err)
				
				fs.writeFile(assetPath, templateData, function(err)
				{
					if (err) next(err)
					
					var repo = git(app.get("dataRoot") + projectName)
					repo.add(assetName + "." + assetType, function(err)
					{
						if (err) next(err)
						
						repo.commit("added new " + assetType, {author: "MrPlop <mr_plop@plop.net>"}, function(err)
						{
							if (err) next(err)
							
							res.send(200, "Asset created")
						})
					})
				})
			})
		})
	})

	app.get("/data/project/:projectId/asset/:assetId", function(req, res)
	{
		var projectId = req.params.projectId
		var assetId = req.params.assetId
		
		var assetPath = app.get("dataRoot") + projectId + "/" + assetId
		fs.readFile(assetPath, function(err, assetData)
		{
			if (err) next(err)
			
			res.type("application/json")
			res.send(200, assetData)
		})
	})
}
