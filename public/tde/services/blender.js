angular.module("tde.services.blender", [])

.service("Blender", function($rootScope, User)
{
  var self = this
  
  this.connected = false;
  
  var blender = new BlenderWebSocket()
  blender.setAxes("xzY")
  
  Object.defineProperty(this, "context", {
    get: function() { return blender.context; },
    enumerable: true
  });
  
  Object.defineProperty(this, "data", {
    get: function() { return blender.data; },
    enumerable: true
  });
  
  Object.defineProperty(this, "scenes", {
    get: function() { return blender.scenes; },
    enumerable: true
  });
  
  self.mustConnect = false
  
  var retryTimeoutId
  
  blender.addListener("close", function() {
    $rootScope.$apply(function() {
      self.connected = false;
    });
    toastr.warning("Disconnected", "Blender");
    if (self.mustConnect)
      retryConnection();
  })
  
  blender.addListener("error", function(app) {
    toastr.error("Error, see the console", "Blender");
    if (self.mustConnect)
      retryConnection();
  })
  
  blender.addListener("open", function(app) {
    $rootScope.$apply(function() {
      self.connected = true;
    });
    toastr.success("Connected (" + app.versionString + ")", "Blender");
  })
  
  function retryConnection(options) {
    retryTimeoutId = setTimeout(function() {
      self.open()
    }, 1000)
  }
  
  function abortConnection() {
    clearTimeout(retryTimeoutId)
  }
  
  this.open = function() {
    abortConnection()
    self.mustConnect = true
    blender.open({
      url: User.prefs.blenderUrl
    })
  }
  
  this.close = function() {
    abortConnection()
    self.mustConnect = false
    blender.close();
  }
  
  this.addListener = function(event, handler) {
    return blender.addListener(event, handler);
  }
  
  this.removeListener = function(event, handler) {
    return blender.removeListener(event, handler);
  }
  
  this.setTime = function(scene, time) {
    var s = blender.scenes[scene];
    if (!s)
      return;
    
    var frame = Math.floor(time * s.fps);
    if (s.frame === frame)
      return;
    
    return blender.setScene(scene, {
      "frame": frame
    });
  }
  
})
