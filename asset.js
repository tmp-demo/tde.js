//var git = require("gift")
var fs = require("fs")
var Cookies = require("cookies")

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
      
      res.json(assets)
    })
  })

  app.post("/data/project/:projectId/assets", function(req, res, next)
  {
    var projectName = req.params.projectId
    var assetName = req.body.name
    var assetType = req.body.type
    
    if (/^[-\w.]+$/.test(assetName) == false)
    {
      return next(new Error("Asset names should match /^[-\\w.]+$/"))
    }
    
    var templatePath = __dirname + "/data_templates/" + assetType + ".tpl"
    var assetPath = app.get("dataRoot") + projectName + "/" + assetName + "." + assetType
    
    fs.exists(assetPath, function(exists)
    {
      if (exists) return next(new Error("Asset already exists"))
      
      fs.readFile(templatePath, function(err, templateData)
      {
        if (err) return next(err)
        
        fs.writeFile(assetPath, templateData, function(err)
        {
          if (err) return next(err)
          
          /*var repo = git(app.get("dataRoot") + projectName)
          repo.add(assetName + "." + assetType, function(err)
          {
            if (err) return next(err)
            
            var cookies = new Cookies(req, res)
            var authorString = cookies.get("name") + " <" + cookies.get("email") + ">"
            repo.commit("added new " + assetType, {author: authorString}, function(err)
            {
              if (err) return next(err)
              
              res.send(200, "Asset created")
            })
          })*/
          
          res.send(200, "Asset created")
        })
      })
    })
  })

  app.get("/data/project/:projectId/asset/:assetId", function(req, res, next)
  {
    var projectId = req.params.projectId
    var assetId = req.params.assetId
    
    var assetPath = app.get("dataRoot") + projectId + "/" + assetId
    fs.readFile(assetPath, function(err, assetData)
    {
      if (err) return next(err)
      
      res.type("text/plain")
      res.send(200, assetData)
    })
  })

  app.get("/data/project/:projectId/static-asset/:assetId", function(req, res, next)
  {
    var projectId = req.params.projectId
    var assetId = req.params.assetId

    var assetPath = app.get("dataRoot") + projectId + "/static/" + assetId
    fs.readFile(assetPath, function(err, assetData)
    {
      if (err) return next(err)

      res.send(200, assetData)
    })
  })


  app.put("/data/project/:projectId/asset/:assetId", function(req, res, next)
  {
    var projectId = req.params.projectId
    var assetId = req.params.assetId
    
    var assetPath = app.get("dataRoot") + projectId + "/" + assetId
    fs.writeFile(assetPath, req.body.assetData, function(err)
    {
      if (err) return next(err)
      
      /*var repo = git(app.get("dataRoot") + projectId)
      repo.add(assetPath, function(err)
      {
        if (err) return next(err)
        
        var cookies = new Cookies(req, res)
        var authorString = cookies.get("name") + " <" + cookies.get("email") + ">"
        repo.commit("updated " + assetId, {author: authorString}, function(err)
        {
          if (err) return next(err)
          
          res.send(200, "Asset udpated")
        })
      })*/
      
      res.send(200, "Asset updated")
    })
  })
  
  app.post("/data/project/:projectId/asset/:assetId", function(req, res, next)
  {
    var projectId = req.params.projectId
    var assetId = req.params.assetId
    
    if (typeof(req.body.rename) !== "string") return next(new Error("Unsupported operation"))
    
    if (/^[-\w.]+$/.test(req.body.rename) == false)
    {
      return next(new Error("Asset names should match /^[-\\w.]+$/"))
    }
    
    var assetPath = app.get("dataRoot") + projectId + "/" + assetId
    var newAssetPath = app.get("dataRoot") + projectId + "/" + req.body.rename
    
    if (assetPath == newAssetPath) return next(new Error("New name is the same as old name"))
    
    fs.rename(assetPath, newAssetPath, function(err)
    {
      if (err) return next(err)
      
      /*var repo = git(app.get("dataRoot") + projectId)
      repo.add(newAssetPath, function(err)
      {
        if (err) return next(err)
        
        repo.remove(assetPath, function(err)
        {
          if (err) return next(err)
          
          var cookies = new Cookies(req, res)
          var authorString = cookies.get("name") + " <" + cookies.get("email") + ">"
          repo.commit("renamed " + assetId + " to " + req.body.rename, {author: authorString}, function(err)
          {
            if (err) return next(err)
            
            res.send(200, "Asset renamed")
          })
        })
      })*/
      
      res.send(200, "Asset renamed")
    })
  })
}
