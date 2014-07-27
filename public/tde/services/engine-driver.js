angular.module("tde.services.engine-driver", [])

.service("EngineDriver", function()
{
  var self = this
  
  this.logBuffer = []
  this.currentTime = 0
  
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
      render_scene(scenes[0], 0, 0);
      engine_render(self.currentTime)
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
  
  this.logInfo = function(message, details)
  {
    this.logBuffer.push({
      type: "info",
      message: message,
      details: details
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
  
  this.play = function()
  {
    this.playing = true
    this.seek(this.currentTime)
    
    function render()
    {
      self.currentTime = audioContext.currentTime - start_time;
      engine_render(self.currentTime)
      
      if (self.playing)
        requestAnimationFrame(render)
    }
    
    render()
  }
  
  this.pause = function()
  {
    this.playing = false
  }
  
  this.seek = function(time)
  {
    self.currentTime = time
    start_time = audioContext.currentTime - self.currentTime
    
    if (!this.playing)
      engine_render(self.currentTime)
  }
})
