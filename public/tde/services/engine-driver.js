angular.module("tde.services.engine-driver", [])

.service("EngineDriver", function()
{
  var self = this
  
  this.logBuffer = [
    { type: "info", message: "youpi" },
    { type: "error", message: "does not work" }
  ]
  
  this.loadTexture = function(name, data)
  {
  }
  
  this.unloadTexture = function(name)
  {
  }
  
  this.loadGeometry = function(name, data)
  {
    self.logInfo("loading " + name)
  }
  
  this.unloadGeometry = function(name)
  {
  }
  
  this.loadSequence = function(name, data)
  {
    self.logInfo("loading " + name)
    
    try
    {
      eval(data)
      demo_init()
      gfx_init()
      render_scene(demo.scenes[0], 0, 0);
    }
    catch (err)
    {
      self.logError(err.message, err.stack)
    }
  }
  
  this.unloadSequence = function(name)
  {
    // leak everything
  }
  
  this.loadSong = function(name, data)
  {
  }
  
  this.unloadSong = function(name)
  {
  }
  
  this.loadShader = function(name, data)
  {
  }
  
  this.unloadShader = function(name)
  {
  }
  
  this.logInfo = function(message)
  {
    this.logBuffer.push({
      type: "info",
      message: message
    })
  }
  
  this.logError = function(message, details)
  {
    this.logBuffer.push({
      type: "error",
      message: message,
      details: details
    })
  }
})
