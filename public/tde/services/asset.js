angular.module("tde.services.asset", [])

.service("Asset", function($rootScope, $http, $routeParams, EngineDriver)
{
  var self = this;
  
  this.assets = {};
  this.currentProjectId = "";
  
  var assetTypes = {
    "config": {
      icon: "gears",
      loader: "loadConfig",
      unloader: "unloadConfig",
    },
    "tex": {
      icon: "picture-o",
      loader: "loadTexture",
      unloader: "unloadTexture",
    },
    "geom": {
      icon: "cube",
      loader: "loadGeometry",
      unloader: "unloadGeometry",
    },
    "js": {
      icon: "file-code-o",
      loader: "loadScript",
      unloader: "unloadScript",
    },
    "seq": {
      icon: "film",
      loader: "loadSequence",
      unloader: "unloadSequence",
    },
    "rg": {
      icon: "sitemap",
      loader: "loadRenderGraph",
      unloader: "unloadRenderGraph",
    },
    "scene": {
      icon: "film",
      loader: "loadScene",
      unloader: "unloadScene",
    },
    "snd": {
      icon: "music",
      loader: "loadSoundtrack",
      unloader: "unloadSoundtrack",
    },
    "glsllib": {
      icon: "database",
      loader: "loadShader",
      unloader: "unloadShader",
    },
    "glsl": {
      icon: "globe",
      loader: "loadShader",
      unloader: "unloadShader",
    },
  };

  function assetParts(assetId) {
    var index = assetId.lastIndexOf(".");
    return (index === -1 ? {
      name: assetId,
      type: ""
    } : {
      name: assetId.substr(0, index),
      type: assetId.substr(index + 1)
    });
  }
  
  this.refreshAssetList = function()
  {
    if ($routeParams.projectId)
    {
      $http.get("/data/projects/" + $routeParams.projectId + "/assets").success(function(assetList) {
        assetList.forEach(function(assetId) {
          console.log("loading asset " + assetId);
          self.loadAsset(assetId);
        });
      });
    }
  }

  this.createAsset = function(type, callback)
  {
    var name = type + Date.now();
    var asset = {
      name: name,
      type: type
    }
    
    $http.post("/data/project/" + $routeParams.projectId + "/assets", asset)
      .success(function()
      {
        self.refreshAssetList()
        return callback(null, asset)
      })
      .error(function(error)
      {
        return callback(error, asset)
      });
  }
  
  this.renameAsset = function(assetId, newName, callback)
  {
    $http.post("/data/projects/" + $routeParams.projectId + "/assets/" + assetId, {rename: newName}).
      success(function()
      {
        self.unloadAsset(assetId)
        self.loadAsset(newName, callback)
      })
      .error(callback)
  }
  
  this.updateAsset = function(assetId, data, callback)
  {
    $http.put("/data/projects/" + $routeParams.projectId + "/assets/" + assetId, {assetData: data}).
      success(function()
      {
	      toastr.success(assetId, 'Saved');
        self.unloadAsset(assetId)
        self.loadAsset(assetId, callback)
      }).
      error(function(error)
      {
	      toastr.error(assetId, 'Failed to save');
        if (callback)
          callback(error)
      })
  }

  this.loadAsset = function(assetId, callback)
  {
    var staticPath = "/data/projects/" + $routeParams.projectId + "/static-assets";
    $http.get("/data/projects/" + $routeParams.projectId + "/assets/" + assetId, {transformResponse: function(data) {return data;} })
      .success(function(data) {
        self.assets[assetId] = data

        var parts = assetParts(assetId);
        var assetType = assetTypes[parts.type];
        if (!assetType) {
          console.warn("Unknown asset type", parts.type);
          return callback && callback();
        }

        var options = {
          staticPath: staticPath,
          assetId: assetId,
          name: parts.name,
          type: parts.type,
          data: data,
        };

        return EngineDriver[assetType.loader](options, function() {
          $rootScope.$broadcast("assetListChanged")
          $rootScope.$broadcast("assetLoaded", assetId)
          
          if (callback)
            return callback();
        });
      })
      .error(callback);
  }

  this.unloadAsset = function(assetId)
  {
    if (!(assetId in self.assets))
      return;
    
    var staticPath = "/data/projects/" + $routeParams.projectId + "/static-assets";
    var parts = assetParts(assetId);
    var assetType = assetTypes[parts.type];
    if (!assetType) {
      toastr.warning(parts.type, "Unknown asset type");
      return callback();
    }

    var options = {
      staticPath: staticPath,
      assetId: assetId,
      name: parts.name,
      type: parts.type,
    };

    return EngineDriver[assetType.unloader](options, function() {
      $rootScope.$broadcast("assetListChanged");
      $rootScope.$broadcast("assetUnloaded", assetId);
    });
  }

  this.getTypeIconClass = function(assetId)
  {
    var parts = assetParts(assetId);
    var assetType = assetTypes[parts.type];
    var glyphicon = assetType && assetType.icon || "file-o";

    return "fa fa-" + glyphicon
  }
  
  $rootScope.$on('$routeChangeSuccess', function()
  {
    if (self.currentProjectId != $routeParams.projectId)
    {
      var assetList = Object.keys(self.assets)
      for (var i = 0; i < assetList.length; i++)
      {
        self.unloadAsset(assetList[i])
      }
      
      self.currentProjectId = $routeParams.projectId
      self.refreshAssetList()
    }
  })
})
