angular.module("tde.services.asset", [])

.service("Asset", function($rootScope, $http, $routeParams, EngineDriver)
{
  this.assets = {}
  this.currentProjectId = ""
  
  var self = this
  this.refreshAssetList = function()
  {
    if ($routeParams.projectId)
    {
      $http.get("/data/project/" + $routeParams.projectId + "/assets").success(function(assetList) {
        for (var i = 0; i < assetList.length; i++)
        {
          console.log("loading " + assetList[i])
          self.loadAsset(assetList[i])
        }
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
        self.unloadAsset(assetId)
        self.loadAsset(assetId, callback)
      }).
      error(function(error)
      {
        if (callback)
          callback(error)
      })
  }
  
  this.loadAsset = function(assetId, callback)
  {
    $http.get("/data/project/" + $routeParams.projectId + "/asset/" + assetId).
      success(function(data)
      {
        if (typeof(data) == "object") data = JSON.stringify(data)
        self.assets[assetId] = data
        
        var parts = assetId.split(".")
        var name = parts[0]
        var type = parts[1]
        switch (type)
        {
          case "tex": EngineDriver.loadTexture(name, data); break
          case "geom": EngineDriver.loadGeometry(name, data); break
          case "seq": EngineDriver.loadSequence(name, data); break
          case "song": EngineDriver.loadSong(name, data); break
          case "glsl": EngineDriver.loadShader(name, data); break
          default: alert("unknown asset type: " + type); break
        }
        
        $rootScope.$broadcast("assetListChanged")
        $rootScope.$broadcast("assetLoaded", assetId)
        if (callback)
          callback(null)
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
    
    var parts = assetId.split(".")
    var name = parts[0]
    var type = parts[1]
    switch (type)
    {
      case "tex": EngineDriver.unloadTexture(name); break
      case "geom": EngineDriver.unloadGeometry(name); break
      case "seq": EngineDriver.unloadSequence(name); break
      case "song": EngineDriver.unloadSong(name); break
      case "glsl": EngineDriver.unloadShader(name); break
      default: alert("unknown asset type: " + type); break
    }
    
    $rootScope.$broadcast("assetListChanged")
    $rootScope.$broadcast("assetUnloaded", assetId)
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
