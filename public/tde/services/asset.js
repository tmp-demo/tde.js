angular.module("tde.services.asset", [])

.service("Asset", function($rootScope, $http, $routeParams, EngineDriver)
{
  this.assets = {}
  this.currentProjectId = ""
  
  var assetsOrder = [
    "tex",
    "geom",
    "ogg",
    "seq",
    "song",
    "glsllib",
    "glsl"
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
        self.gRemainingAssets = assetList.length;
        assetList.sort(assetsOrderCompare).forEach(function(assetId) {
          console.log("loading asset " + assetId)
          if (assetId !== "demo.seq") {
            self.loadAsset(assetId)
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
        
        var parts = assetParts(assetId)
        var name = parts[0]
        var type = parts[1]
        switch (type)
        {
          case "tex": EngineDriver.loadTexture(name, data); break
          case "geom": EngineDriver.loadGeometry(name, data); break
          case "seq": EngineDriver.loadSequence(name, data); break
          case "song": EngineDriver.loadSong(name, data); break
          case "ogg": EngineDriver.loadOgg(name, data); break
          case "glsllib": EngineDriver.loadShader(assetId, data); break
          case "glsl": EngineDriver.loadShader(assetId, data); break
          default: toastr.warning(type, "Unknown asset type"); break
        }
        
        $rootScope.$broadcast("assetListChanged")
        $rootScope.$broadcast("assetLoaded", assetId)
        if (callback) {
          callback(null)
        }
        self.gRemainingAssets--;
        if (self.gRemainingAssets == 1) {
            // TODO!
            // demo.seq needs to be loaded last until we fix the framebuffer dependencies
            self.loadAsset("demo.seq");
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
      case "tex": EngineDriver.unloadTexture(name); break
      case "geom": EngineDriver.unloadGeometry(name); break
      case "seq": EngineDriver.unloadSequence(name); break
      case "song": EngineDriver.unloadSong(name); break
      case "glsllib": EngineDriver.unloadShader(assetId); break
      case "glsl": EngineDriver.unloadShader(assetId); break
      default: toastr.warning(type, "Unknown asset type"); break
    }
    
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
      case "song": glyphicon = "music"; break
      case "glsllib": glyphicon = "database"; break
      case "glsl": glyphicon = "globe"; break
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
