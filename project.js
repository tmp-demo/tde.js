var async = require("async");
var exec = require("child_process").exec;
var fs = require("fs");
var git = require("gift");
var path = require("path");

var projectNameRegexp = /^[-\w]+$/;

exports.init = function(options, app) {

  app.get("/data/projects", function(req, res, next) {
    return fs.readdir(options.data, function(err, files) {
      if (err) return next(err);
      
      return async.filter(files, function(file, callback) {
        return fs.stat(path.resolve(options.data, file), function(err, stats) {
          if (err) return callback(false);
          return callback(stats.isDirectory());
        });

      }, function(folders) {
        return res.json(folders);
      });
    });
  });
  
  app.post("/data/projects", function(req, res, next) {
    var projectName = req.body.name;
    
    if (!projectNameRegexp.test(name))
      return next(new Error("Project names should match " + projectNameRegexp.source));
    
    var projectFolder = path.resolve(options.data, projectName);
    fs.mkdir(projectFolder, function(err) {
      if (err) return next(err);

      if (options.git) {
        return git.init(projectFolder, function(err) {
          if (err) return next(err);
          return res.status(201).send("Project created");
        });
      }
      
      return res.status(201).send("Project created");
    });
  });
  
  app.get("/export/:projectId", function(req, res) {
    var projectId = req.params.projectId;
    
    var demoFilename = path.resolve(options.export, projectId, "/demo.png.html");
    fs.unlink(demoFilename, function() {
      var command = "cd \"" + __dirname + "\" && ./EXPORT.sh " + projectId;
      
      // hack for windows debug (assumes cygwin is installed in c:\cygwin)
      if (process.platform === "win32")
        command = "c:/cygwin/bin/bash.exe --login -c \"cd '" + __dirname + "' && ./EXPORT.sh " + projectId + "\"";
      
      return exec(command, function(err, stdout, stderr) {
        return fs.exists(demoFilename, function(exists) {
          if (!exists)
            return res.type("text/plain")
              .status(500)
              .send("== Export failed ==\n\nstdout:\n" + stdout + "\n\nstderr:\n" + stderr);
          
          res.type("text/html");
          return fs.createReadStream(demoFilename).pipe(res);
        });
      });
    });
  });
};
