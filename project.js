var git = require("gift")
var fs = require("fs")
var exec = require("child_process").exec

function validateProjectName(name)
{
  return /^[-\w]+$/.test(name)
}

module.exports.init = function(app)
{
  app.get("/data/projects", function(req, res, next)
  {
    fs.readdir(app.get("dataRoot"), function(err, files)
    {
      if (err) return next(err)
      
      var folders = files.filter(function(file)
      {
        var stats = fs.statSync(app.get("dataRoot") + file)
        return stats.isDirectory()
      })
      
      res.json(folders)
    })
  })
  
  app.post("/data/projects", function(req, res, next)
  {
    var projectName = req.body.name
    
    if (!validateProjectName(projectName)) return next(new Error("Project names should match /^[-\\w]+$/"))
    
    var projectFolder = app.get("dataRoot") + projectName
    fs.mkdir(projectFolder, function(err)
    {
      if (err) return next(err)
      
      git.init(projectFolder, function(err, repo)
      {
        if (err) next(err)
        
        res.send(201, "Project created")
      })
    })
  })
  
  app.get("/export/:projectId", function(req, res)
  {
    var projectId = req.params.projectId
    
    var demoFilename = __dirname + "/export/demo.png.html"
    fs.unlink(demoFilename, function(err)
    {
      var command = "cd \"" + __dirname + "\" && ./EXPORT.sh"
      
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
}
