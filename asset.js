var async = require("async");
var Cookies = require("cookies");
var fs = require("fs");
var git = require("gift");
var path = require("path");
var vm = require("vm");

var assetNameRegexp = /^[-\w]+$/;

exports.init = function(options, app) {

  app.get("/data/projects/:projectId/assets", function(req, res, next) {
    var projectId = req.params.projectId;
    var assetDependencies = {};

    return fs.readdir(path.resolve(options.data, projectId), function(err, files) {
      if (err) return next(err);
      
      return async.filter(files, function(file, callback) {
        return fs.stat(path.resolve(options.data, projectId, file), function(err, stats) {
          if (err) return callback(false);
          return callback(stats.isFile());
        });

      }, function(assetNames) {
        return async.each(assetNames.sort(), function(file, callback) {
          var dependencies = [];
          assetDependencies[file] = dependencies;

          switch (path.extname(file)) {
            case ".glsl":
            case ".glsllib":
              return fs.readFile(path.resolve(options.data, projectId, file), function(err, data) {
                if (err) return callback(err);
                var contents = data.toString();
                var regexp = /\/\/\!\s+INCLUDE\s+(.+)$/gm;
                var match;
                while ((match = regexp.exec(contents))) {
                  dependencies.push(match[1].trim());
                }
                return callback();
              });
            case ".rg":
              return fs.readFile(path.resolve(options.data, projectId, file), function(err, data) {
                if (err) return callback(err);
                var contents = data.toString();
                var sandbox = {};
                vm.runInNewContext("_=" + contents, sandbox);
                if (sandbox._ && sandbox._.render_passes)
                  sandbox._.render_passes.forEach(function(pass) {
                    if (pass.program)
                      dependencies.push(pass.program + ".glsl");
                    if (pass.programs)
                      pass.programs.forEach(function(program) {
                        dependencies.push(program + ".glsl");
                    });
                    if (pass.select_program)
                      dependencies.push("demo.seq");
                  });
                return callback();
              });
            default:
              return callback();
          }
        }, function(err) {
          if (err) return next(err);

          var assetNames = [];

          function addAsset(name) {
            var dependencies = assetDependencies[name];
            if (!dependencies) return console.warn("Unresolved dependency: %s", name);
            dependencies.forEach(addAsset);
            if (assetNames.indexOf(name) === -1)
              assetNames.push(name);
          }

          Object.keys(assetDependencies).forEach(addAsset);

          return res.json(assetNames);
        });
      });
    });
  });

  app.post("/data/projects/:projectId/assets", function(req, res, next) {
    var projectId = req.params.projectId;
    var assetName = req.body.name;
    var assetType = req.body.type;
    
    if (!assetNameRegexp.test(assetName))
      return next(new Error("Asset names should match " + assetNameRegexp.source));
    
    var templatePath = path.resolve(options.templates, assetType + ".tpl");
    var assetPath = path.resolve(options.data, projectId, assetName + "." + assetType);
    
    return fs.exists(assetPath, function(exists) {
      if (exists) return next(new Error("Asset already exists"));
      
      return fs.readFile(templatePath, function(err, templateData) {
        if (err) return next(err);
        
        return fs.writeFile(assetPath, templateData, function(err) {
          if (err) return next(err);
          
          if (options.git) {
            var repo = git(path.resolve(options.data, projectId));
            return repo.add(assetName + "." + assetType, function(err) {
              if (err) return next(err);
              
              var cookies = new Cookies(req, res);
              var authorString = cookies.get("name") + " <" + cookies.get("email") + ">";
              return repo.commit("Add " + assetName + " as new " + assetType, {author: authorString}, function(err) {
                if (err) return next(err);
                return res.status(201).send("Asset created");
              });
            });
          }
          
          return res.status(201).send("Asset created");
        });
      });
    });
  });

  app.get("/data/projects/:projectId/assets/:assetId", function(req, res, next) {
    var projectId = req.params.projectId;
    var assetId = req.params.assetId;
    
    var assetPath = path.resolve(options.data, projectId, assetId);
    return fs.readFile(assetPath, function(err, assetData) {
      if (err) return next(err);
      res.type("text/plain").send(assetData);
    });
  });

  app.get("/data/projects/:projectId/static-assets/:assetId", function(req, res, next) {
    var projectId = req.params.projectId;
    var assetId = req.params.assetId;

    var assetPath = path.resolve(options.data, projectId, "static", assetId);
    return fs.readFile(assetPath, function(err, assetData) {
      if (err) return next(err);
      res.type("text/plain").send(assetData);
    });
  });

  app.put("/data/projects/:projectId/assets/:assetId", function(req, res, next) {
    var projectId = req.params.projectId;
    var assetId = req.params.assetId;
    
    var assetPath = path.resolve(options.data, projectId, assetId);
    return fs.writeFile(assetPath, req.body.assetData, function(err) {
      if (err) return next(err);
      
      if (options.git) {
        var repo = git(path.resolve(options.data, projectId));
        return repo.add(assetPath, function(err) {
          if (err) return next(err);
          
          var cookies = new Cookies(req, res);
          var authorString = cookies.get("name") + " <" + cookies.get("email") + ">";

          repo.commit("Update " + assetId, {author: authorString}, function(err) {
            if (err) return next(err);
            return res.send("Asset udpated");
          });
        });
      }
      
      return res.send("Asset updated");
    });
  });
  
  app.post("/data/projects/:projectId/assets/:assetId", function(req, res, next) {
    var projectId = req.params.projectId;
    var assetId = req.params.assetId;
    
    if (typeof(req.body.rename) !== "string") return next(new Error("Unsupported operation"));
    
    if (!assetNameRegexp.test(req.body.rename))
      return next(new Error("Asset names should match " + assetNameRegexp.source));
    
    var assetPath = path.resolve(options.data, projectId, assetId);
    var newAssetPath = path.resolve(options.data, projectId, req.body.rename);
    
    if (assetPath === newAssetPath) return next(new Error("New name is the same as old name"));
    
    return fs.rename(assetPath, newAssetPath, function(err) {
      if (err) return next(err);
      
      if (options.git) {
        var repo = git(path.resolve(options.data, projectId));
        return repo.add(newAssetPath, function(err) {
          if (err) return next(err);
          
          return repo.remove(assetPath, function(err) {
            if (err) return next(err);
            
            var cookies = new Cookies(req, res);
            var authorString = cookies.get("name") + " <" + cookies.get("email") + ">";

            return repo.commit("Rename " + assetId + " to " + req.body.rename, {author: authorString}, function(err) {
              if (err) return next(err);
              return res.send("Asset renamed");
            });
          });
        });
      }
      
      return res.send("Asset renamed");
    });
  });
};
