angular.module("tde.services.engine-driver", [])

.service("EngineDriver", function()
{
  var self = this
  
  this.loadSequence = function(name, data)
  {
    console.log("loading seq " + name)
    eval(data)
    demo_init()
    gfx_init()
    render_scene(demo.scenes[0], 0, 0);
  }
  
  this.unloadSequence = function(name)
  {
    // leak everything
  }
})
