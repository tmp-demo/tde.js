angular.module("tde.services.asset", [])

.service("Asset", function($rootScope, $http, $routeParams, EngineDriver)
{
  this.assets = {}
  this.currentProjectId = ""

  // These asset types will always be loaded after the ones that are not in this list.
  var postponedAssetTypes = [
    "rg",
  ]

  var assetsOrder = [
    "js",
    "tex",
    "geom",
    "scene",
    "seq",
    "snd",
    "glsllib",
    "glsl",
    "rg",
  ]

  function assetParts(assetId) {
    var index = assetId.lastIndexOf(".")
    return (index === -1 ? [assetId, ""] : [assetId.substr(0, index), assetId.substr(index + 1)])
  }
  
  function assetsOrderCompare(a, b) {
    var partsA = assetParts(a)
    var nameA = partsA[0]
    var typeA = partsA[1]
    var orderA = assetsOrder.indexOf(typeA)
    
    var partsB = assetParts(b)
    var nameB = partsB[0]
    var typeB = partsB[1]
    var orderB = assetsOrder.indexOf(typeB)
    
    if (orderA !== orderB)
      return orderA - orderB
    
    return nameA.localeCompare(nameB)
  }

  var self = this
  this.refreshAssetList = function()
  {
    if ($routeParams.projectId)
    {
      $http.get("/data/project/" + $routeParams.projectId + "/assets").success(function(assetList) {
        // number of assets to load before loading the postponed ones
        self.gRemainingAssets = 0;
        // number of assets to load before initializing gfx
        self.gAllRemainingAssets = assetList.length;

        assetList.sort(assetsOrderCompare).forEach(function(assetId) {
          var nameSplit = assetId.split(".");
          var assetType = nameSplit[nameSplit.length-1];

          var shouldPostpone = (postponedAssetTypes.indexOf(assetType) >= 0);

          if (shouldPostpone) {
            self.postponedAssets = self.postponedAssets || [];
            self.postponedAssets.push(assetId);
          } else {
            console.log("loading asset " + assetId);
            self.loadAsset(assetId);
            self.gRemainingAssets++;
          }
        })
      })
    }
  }

  this.createAsset = function(type, callback)
  {
    var name = type + Date.now()
    var asset = {name: name, type: type}
    
    $http.post("/data/project/" + $routeParams.projectId + "/assets", asset).
      success(function()
      {
        self.refreshAssetList()
        if (callback)
          callback(null, asset)
      }).
      error(function(error)
      {
        if (callback)
          callback(error, asset)
      })
  }
  
  this.renameAsset = function(assetId, newName, callback)
  {
    $http.post("/data/project/" + $routeParams.projectId + "/asset/" + assetId, {rename: newName}).
      success(function()
      {
        self.unloadAsset(assetId)
        self.loadAsset(newName, callback)
      }).
      error(function(error)
      {
        if (callback)
          callback(error)
      })
  }
  
  this.updateAsset = function(assetId, data, callback)
  {
    $http.put("/data/project/" + $routeParams.projectId + "/asset/" + assetId, {assetData: data}).
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
    $http.get("/data/project/" + $routeParams.projectId + "/asset/" + assetId, {transformResponse: function(data) {return data;} }).
      success(function(data)
      {
        self.assets[assetId] = data

        var staticPath = "/data/project/" + $routeParams.projectId + "/static-asset";
        var parts = assetParts(assetId)
        var name = parts[0]
        var type = parts[1]

        var is_async_loading_asset = false;
        switch (type)
        {
          case "js":  {
            EngineDriver.loadScript(name, data); break;
          }
          case "config":  {
            EngineDriver.loadConfig(name, data); break;
          }
          case "tex":     {
            is_async_loading_asset = true;
            EngineDriver.loadTexture(name, data, staticPath, callback ? callback : function(){}); break;
          }
          case "geom":    {
            EngineDriver.loadGeometry(name, data); break;
          }
          case "seq":     {
            EngineDriver.loadSequence(name, data); break;
          }
          case "rg":      {
            EngineDriver.loadRenderGraph(name, data); break;
          }
          case "scene":   {
            EngineDriver.loadScene(name, data); break;
          }
          case "snd":     {
            EngineDriver.loadSoundtrack(name, data, staticPath); break;
          }
          case "glsllib": {
            EngineDriver.loadShader(assetId, data); break;
          }
          case "glsl":    {
            EngineDriver.loadShader(assetId, data); break;
          }
          default: toastr.warning(type, "Unknown asset type"); break
        }

        $rootScope.$broadcast("assetListChanged")
        $rootScope.$broadcast("assetLoaded", assetId)
        if (callback & !is_async_loading_asset) {
          callback(null);
        }
        self.gRemainingAssets--;
        self.gAllRemainingAssets--;
        console.log("remaining assets ", self.gRemainingAssets );
        if (self.gRemainingAssets == 0) {
          console.log("Loading postponed assets");
          for (var i in self.postponedAssets) {
            self.loadAsset(self.postponedAssets[i]);
          }
          self.postponedAssets = [];
        }

        if (self.gAllRemainingAssets == 0) {
          // init gfx after everything has been loaded
          gfx_init();
          engine_render(snd.t());
          // make sure that gAllRemainingAssets will never be 0 again even if we ++ or -- it.
          self.gAllRemainingAssets = NaN;
        }
      }).
      error(function(error)
      {
        if (callback)
          callback(error)
      })
  }

  this.unloadAsset = function(assetId)
  {
    if (!(assetId in self.assets))
      return

    var parts = assetParts(assetId)
    var name = parts[0]
    var type = parts[1]
    switch (type)
    {
      case "js": EngineDriver.unloadScript(name); break
      case "config": EngineDriver.unloadConfig(name); break
      case "tex": EngineDriver.unloadTexture(name); break
      case "geom": EngineDriver.unloadGeometry(name); break
      case "seq": EngineDriver.unloadSequence(name); break
      case "rg": EngineDriver.unloadRenderGraph(name); break
      case "scene": EngineDriver.unloadScene(name); break
      case "snd": EngineDriver.unloadSoundtrack(name); break
      case "glsllib": EngineDriver.unloadShader(assetId); break
      case "glsl": EngineDriver.unloadShader(assetId); break
      default: toastr.warning(type, "Unknown asset type"); break
    }

    self.gRemainingAssets++;
    $rootScope.$broadcast("assetListChanged")
    $rootScope.$broadcast("assetUnloaded", assetId)
  }

  this.getTypeIconClass = function(assetId)
  {
    var glyphicon = "file-o"
    switch (assetParts(assetId)[1])
    {
      case "tex": glyphicon = "picture-o"; break
      case "geom": glyphicon = "cube"; break
      case "seq": glyphicon = "film"; break
      case "scene": glyphicon = "film"; break // TODO
      case "soundtrack": glyphicon = "music"; break
      case "glsllib": glyphicon = "database"; break
      case "glsl": glyphicon = "globe"; break
      case "rg": glyphicon = "film"; break // TODO
    }
    
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
