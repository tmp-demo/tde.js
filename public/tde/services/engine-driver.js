angular.module("tde.services.engine-driver", [])

.service("EngineDriver", function()
{
  var self = this

  this.logBuffer = []
  this.currentTime = 0

  this.loadTexture = function(name, data)
  {
    self.logInfo("loading texture "+ name);
    var asset = eval(data);
    switch (asset.type) {
      case "empty": {
        // A texture allocated but with no content, typically used as a render
        // target.
        textures[name] = create_texture(
          eval(asset.width  || "undefined"),
          eval(asset.height || "undefined"),
          eval(asset.format || "undefined"),
          null, // no data
          eval(asset.allow_repeat || "undefined"),
          eval(asset.linear_filtering || "undefined"),
          eval(asset.mipmaps || "undefined")
        );
        break;
      }
      case "js": {
        // A texture initialized from a js function
        textures[name] = asset.generator();
        break;
      }
      case "text": {
        // A set of textures containing some text
        for (var i = 0; i <asset.data.length; ++i) {
          var item = asset.data[i];
          textures[item.id] = create_text_texture(item.size, item.text);
        }
        break;
      }
      default: {
        self.logInfo("unsupported texture type " + asset.type);
      }
    }
  }

  this.unloadTexture = function(name)
  {
    self.logInfo("unloading texture " + name)
    destroy_texture(textures[name])
  }

  this.loadGeometry = function(name, data)
  {
    self.logInfo("loading geometry " + name)
    var geometry_generator = eval(data)
    geometries[name] = geometry_generator();
    self.drawFrame();
  }

  this.unloadGeometry = function(name)
  {
    self.logInfo("unloading geom " + name)
    destroy_geom(geometries[name])
  }

  this.loadSequence = function(name, data)
  {
    self.logInfo("loading timeline " + name)

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
    self.logInfo("loading song " + name)

    try
    {
      eval(data)
      snd = new SND(SONG)
    }
    catch (err)
    {
      self.logError(err.message, err.stack)
    }
  }

  this.unloadSong = function(name)
  {
    if (snd)
      snd.playing = false
  }

  this.loadShader = function(name, data)
  {
  }

  this.unloadShader = function(name)
  {
  }

  this.logInfo = function(message, details)
  {
    toastr.info(details, message);
    this.logBuffer.push({
      type: "info",
      message: message,
      details: details
    })
  }

  this.logError = function(message, details)
  {
    toastr.error(details, message);
    console.error(message)
    console.error(details)
    this.logBuffer.push({
      type: "error",
      message: message,
      details: details
    })
  }

  this.drawFrame = function()
  {
    if (gRemainingAssets == 0) {
      engine_render(this.currentTime)
    }
  }
  
  this.play = function()
  {
    this.playing = true
    this.seek(this.currentTime)
    if (snd) {
      snd.p()
    }

    function render()
    {
      if (snd)
        self.currentTime = snd.t()
      else
        self.currentTime = 0;
      
      self.drawFrame()
      
      if (self.playing)
        requestAnimationFrame(render)
    }

    render()
  }

  this.pause = function()
  {
    this.playing = false
    if (snd)
      snd.s()
  }

  this.seek = function(time)
  {
    self.currentTime = time
    if (snd)
      snd.startTime = ac.currentTime - time * (60 / 125) // tempo is 125

    if (!this.playing)
      engine_render(self.currentTime)
  }
})
