var global_scope = this;

angular.module("tde.services.engine-driver", [])

.service("EngineDriver", function($rootScope)
{
  var self = this

  this.currentTime = sessionStorage.getItem("engineViewTime");
  this.sequenceInfo = {
    data: {},
    name: "",
    time: this.currentTime
  }

  // metadata used for dependency tracking and automatic rebuild of dependent shaders
  this.shaders = {}

  this.loadConfig = function(name, data)
  {
    var asset = eval("___ = "+data);
    for (var ac in asset.define) {
      if (config[ac] == undefined) {
        self.logError("Unsupported config option " + ac);
      }
    }
    for (var ec in config) {
      if (asset.define[ec] == undefined) {
        self.logError("Missing config option " + ec);
      }
    }
  }

  this.unloadConfig = function(name, data) {
    // nothing to do
  }

  this.loadScript = function(name, data) {
    self.logInfo("loading script " + name);
    // create a global object named after the asset, only the content of this
    // object will be unloaded.
    eval(name.split(".")[0]+"={}");
    eval(data);
    engine_render(self.currentTime)
  }

  this.unloadScript = function(name, data) {
    eval(name.split(".")[0]+"={}");
  }

  this.loadTexture = function(name, data, staticPath, callback)
  {
    self.logInfo("loading texture "+ name);
    var asset = eval("___ = "+data);
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
          eval(asset.mipmaps || "undefined"),
          eval(asset.float_texture || "undefined")
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
          textures[item.id] = ((asset.vertical || item.vertical) ? create_vertical_text_texture : create_text_texture)(item.size, item.text);
        }
        break;
      }
      case "jpg": {
        // A texture initialized from filesystem image
        textures[name] = create_img_texture(staticPath + "/" + asset.filename,callback);

        break;
      }
      default: {
        self.logInfo("unsupported texture type " + asset.type);
      }
    }
  }

  this.unloadTexture = function(name)
  {
    if (textures[name]) {
      self.logInfo("unloading texture " + name);
      destroy_texture(textures[name]);
    }
  }

  this.loadGeometry = function(name, data)
  {
    self.logInfo("loading geometry " + name);
    var asset = eval("___ = "+data);
    switch (asset.type) {
      case "js": {
        // A texture initialized from a js function
        geometries[name] = asset.generator();
        break;
      }
      case "buffers": {
        var buffers = [];
        if (asset.positions) {
          buffers.push(make_vbo(POS, asset.positions));
        }
        if (asset.normals) {
          buffers.push(make_vbo(NORMAL, asset.normals));
        }
        if (asset.uvs) {
          buffers.push(make_vbo(UV, asset.normals));
        }
        if (asset.colors) {
          buffers.push(make_vbo(COLOR, asset.colors));
        }

        geometries[name] = {
          buffers: buffers,
          mode: eval(asset.mode),
          vertex_count: eval(asset.vertex_count)
        }
        break;
      }
      case "generated": {
        var geom = {}

        if (asset.positions) { geom.positions = []; }
        if (asset.normals) { geom.normals = []; }
        if (asset.uvs) { geom.uvs = []; }

        extrude_geom(geom, asset.commands);

        var buffers = [];
        if (asset.positions) { buffers.push(make_vbo(POS, geom.positions)); }
        if (asset.normals) { buffers.push(make_vbo(NORMAL, geom.normals)); }
        if (asset.uvs) { buffers.push(make_vbo(UV, geom.uvs)); }

        geometries[name] = {
          buffers: buffers,
          mode: gl.TRIANGLES,
          vertex_count: geom.positions.length / 3
        };
        break;
      }
    }

    self.drawFrame();
  }

  this.unloadGeometry = function(name)
  {
    if (geometries[name]) {
      self.logInfo("unloading geom " + name);
      destroy_geom(geometries[name]);
    }
  }

  this.loadRenderGraph = function(name, data)
  {
    self.logInfo("loading render passes " + name)

    try
    {
      var asset = eval("___ = "+data);
      render_passes = asset.render_passes;
      init_rg(asset);
    }
    catch (err)
    {
      self.logError(err.message, err.stack)
    }

    engine.render = render_rg;

    gfx_init()
    engine_render(self.currentTime)
  }

  this.unloadRenderGraph = function(name)
  {
    // leak everything
  }

  this.loadSequence = function(name, data)
  {
    self.logInfo("loading sequence " + name)

    try
    {
      var asset = sequence = JSON.parse(data);
      sequence = JSON.parse(JSON.stringify(asset.animations));

      // patch the sequence
      for (var u in sequence) {
        var uniform = sequence[u];
        for (var c in uniform) {
          var clip = uniform[c];
          if (clip.evaluate) {
            var function_str = "function(t) { return " + clip.evaluate + "; }";
            console.log("patching uniform "+u+" animation: ", function_str);
            clip.evaluate = eval("_="+function_str);
          }
          //clip.easing = ease_linear;// clip.easing ? eval("_= ease_"+clip.easing) : undefined;
          if (clip.easing) {
            var eval_str = "ease_" + clip.easing;
            clip.easing = global_scope[eval_str];
          }
        }
      }

      self.sequenceInfo.data = asset
      self.sequenceInfo.name = name
      self.sequenceInfo.time = self.currentTime
    }
    catch (err)
    {
      self.logError(err.message, err.stack)
    }

    self.drawFrame();
  }

  this.unloadSequence = function(name)
  {
    sequence = null;

    self.sequenceInfo.data = {}
    self.sequenceInfo.name = ""
  }

  this.loadScene = function(name, data)
  {
    self.logInfo("loading scene " + name)

    try
    {
      scenes[name] = eval("___ = "+data);
    }
    catch (err)
    {
      self.logError(err.message, err.stack)
    }
  }

  this.unloadScene = function(name, data)
  {

  }

  this.loadSoundtrack = function(name, data, staticPath)
  {
    self.logInfo("loading track" + name);
    self.logInfo(data);

    var sndData = eval("_=" + data);

    if (sndData.type == "streaming") {
      snd = SNDStreaming(staticPath + "/" + sndData.path, sndData.bpm);
    } else {
      try
      {
        snd = new SND(sndData);
        if (self.isMute) {
          snd.mute();
        }
      }
      catch (err)
      {
       self.logError(err.message, err.stack);
      }
    }
  }

  this.unloadSoundtrack = function(name)
  {
    if (snd)
      snd.playing = false
  }

  this.loadShader = function(name, data)
  {
    self.logInfo("loading shader " + name)
    self.shaders[name] = self.parseShader(data)
    //self.logInfo("depends on " + self.shaders[name].dependencies)
    self.compileDependentShaders(name)
    self.drawFrame()
  }

  this.unloadShader = function(name)
  {
    self.logInfo("unloading shader " + name)
    destroy_shader_program(name.split(".")[0]);
    delete self.shaders[name]
    self.compileDependentShaders(name)
    self.drawFrame()
  }
  
  this.compileDependentShaders = function(name)
  {
    var shadersToRebuild = self.findDependentShaders(name)
    
    // exclude libraries (glsllib), they are only included and never explicitely compiled
    shadersToRebuild = shadersToRebuild.filter(function(name) { return !name.match(/glsllib$/); })
    
    //console.log("rebuilding " + shadersToRebuild)
    for (var i in shadersToRebuild)
    {
      self.rebuildShader(shadersToRebuild[i])
    }
  }
  
  this.rebuildShader = function(name)
  {
    var shader = self.shaders[name]
    if (!shader) {
      return;
    }
    
    // destroy a possibly existing program
    var shaderName = name.split(".")[0];
    destroy_shader_program(shaderName);
    
    // expand includes
    var vertex = shader.vertexSource
    var fragment = shader.fragmentSource
    var includeRegex = /\/\/![ ]*INCLUDE[ ]+(.*)[\n\r ]+/;
    
    // vertex
    var matches = includeRegex.exec(vertex)
    while (matches)
    {
      var dependency = matches[1]
      
      if (!self.shaders[dependency])
      {
        self.logError("Missing include: " + dependency)
        return null;
      }
      
      //console.log(dependency)
      //console.log(vertex)
      vertex = vertex.replace(new RegExp("//![ ]*INCLUDE[ ]+" + dependency + "[\n\r ]+", "g"), self.shaders[dependency].vertexSource +  "\n")
      //console.log(vertex)
      matches = includeRegex.exec(vertex)
    }
    
    // fragment
    matches = includeRegex.exec(fragment)
    while (matches)
    {
      var dependency = matches[1]
      
      if (!self.shaders[dependency])
      {
        self.logError("Missing include: " + dependency)
        return null;
      }
      
      //console.log(dependency)
      //console.log(fragment)
      fragment = fragment.replace(new RegExp("//![ ]*INCLUDE[ ]+" + dependency + "[\n\r ]+", "g"), self.shaders[dependency].fragmentSource +  "\n")
      //console.log(fragment)
      matches = includeRegex.exec(fragment)
    }
    
    vertex = vertex.replace("main_vs_" + shaderName, "main")
    fragment = fragment.replace("main_fs_" + shaderName, "main")
    console.log("compiling " + name)
    programs[shaderName] = load_program_from_source(vertex, fragment)
  }
  
  this.findDependentShaders = function(rootName)
  {
    var dependentShaders = []
    var newDependencies = [rootName]
    
    while (newDependencies.length > 0)
    {
      var dependency = newDependencies.shift()
      dependentShaders.push(dependency)
      
      for (var name in self.shaders)
      {
        var shader = self.shaders[name]
        if (shader.dependencies.indexOf(dependency) != -1)
        {
          if ((dependentShaders.indexOf(name) == -1) && (newDependencies.indexOf(name) == -1))
          {
            newDependencies.push(name)
          }
        }
      }
    }
    
    console.log(rootName + " -> " + dependentShaders)
    return dependentShaders
  }
  
  this.parseShader = function(shaderSource)
  {
    var sourceParts = self.processShaderSource(shaderSource)
    return {
      dependencies: self.parseShaderDependencies(shaderSource),
      vertexSource: sourceParts.vertex,
      fragmentSource: sourceParts.fragment
    }
  }
  
  this.parseShaderDependencies = function(shaderSource)
  {
    var includeRegex = /\/\/![ ]*INCLUDE[ ]+(.*)[\n\r ]+/g;
    var dependencies = []
    var matches = includeRegex.exec(shaderSource)
    while (matches)
    {
      dependencies.push(matches[1])
      matches = includeRegex.exec(shaderSource)
    }
    
    return dependencies
  }
  
  this.processShaderSource = function(shaderSource)
  {
    var splitRegex = /\/\/![ ]*(COMMON|VERTEX|FRAGMENT)/g;
    var vertexSource = ""
    var fragmentSource = ""
    
    var split = shaderSource.split(splitRegex)
    
    // initial result is always common
    if (split.length > 0)
    {
      var code = split.shift()
      vertexSource += code;
      fragmentSource += code;
    }
    
    while (split.length > 0)
    {
      var category = split.shift()
      var code = split.shift()
      
      switch (category)
      {
        case "COMMON": vertexSource += code; fragmentSource += code; break;
        case "VERTEX": vertexSource += code; break;
        case "FRAGMENT": fragmentSource += code; break;
      }
    }
    
    return {
      vertex: vertexSource,
      fragment: fragmentSource
    }
  }
  
  this.logInfo = function(message, details)
  {
    //toastr.info(details, message);
    console.log(message)
  }

  this.logError = function(message, details)
  {
    toastr.error(details, message);
    console.error(message)
    // var group = console.groupCollapsed || console.group;
    // group.call(console)
    console.error(details)
    // console.groupEnd()
  }

  this.drawFrame = function()
  {
    if (render_passes) {
      engine_render(this.currentTime)
    }
  }
  
  this.drawFrameIfNotPlaying = function()
  {
    if (!self.playing)
      engine_render(this.currentTime)
  }
  
  this.play = function()
  {
    this.playing = true
    this.seek(this.currentTime);
    if (snd) {
      snd.p()
    }

    function render()
    {
      if (snd)
        self.currentTime = snd.t()
      else
        self.currentTime = 0;
      
      sessionStorage.setItem("engineViewTime", self.currentTime);
      $rootScope.$broadcast("currentTime", self.currentTime);
      $rootScope.$apply(function()
      {
        self.sequenceInfo.time = self.currentTime;
      })
      
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
      //snd.startTime = ac.currentTime - time * (60 / 125) // tempo is 125
      snd.seek(time)

    $rootScope.$broadcast("currentTime", self.currentTime);
    
    if (!this.playing)
      engine_render(self.currentTime)
  }

  this.mute = function()
  {
    self.isMute = true
    if (snd)
      snd.mute()
  }

  this.unmute = function()
  {
    self.isMute = false
    if (snd)
      snd.unmute()
  }

  // camera override

  this.overrideCamera = function()
  {
    if (!uniform_editor_overrides.hasOwnProperty("u_cam_pos")) {
      uniform_editor_overrides["u_cam_pos"] = vec3.clone(uniforms["u_cam_pos"])
      uniform_editor_overrides["u_cam_target"] = vec3.clone(uniforms["u_cam_target"])

      //uniform_editor_overrides["u_cam_pos"] = [0, 0, 200]
    }
  }

  this.removeCameraOverride = function() {
    console.log("Removing camera override");
    delete uniform_editor_overrides["u_cam_pos"]
    delete uniform_editor_overrides["u_cam_target"]
    self.drawFrame()
  }

  this.translateEditorCamera = function(localOffset)
  {
    var speed = 0.001

    var viewMatrix = mat4.create()
    var viewMatrixInv = mat4.create()
    mat4.lookAtTilt(viewMatrix, uniform_editor_overrides["u_cam_pos"], uniform_editor_overrides["u_cam_target"], uniforms["u_cam_tilt"])
    mat4.invert(viewMatrixInv, viewMatrix)
    mat3.fromMat4(viewMatrixInv, viewMatrixInv)

    vec3.transformMat3(localOffset, localOffset, viewMatrixInv)
    vec3.add(uniform_editor_overrides["u_cam_pos"], uniform_editor_overrides["u_cam_pos"], localOffset)
    vec3.add(uniform_editor_overrides["u_cam_target"], uniform_editor_overrides["u_cam_target"], localOffset)

    self.drawFrame()
  }

  this.rotateEditorCamera = function(x, y)
  {
    var speed = 0.01
    var rotationY = -x * speed
    var rotationX = y * speed

    var cam_dir = vec3.create()
    vec3.subtract(cam_dir, uniform_editor_overrides["u_cam_target"], uniform_editor_overrides["u_cam_pos"])

    var cam_right = vec3.create()
    vec3.cross(cam_right, [0, 1, 0], cam_dir)
    vec3.normalize(cam_right, cam_right)

    var rotation = quat.create()
    quat.setAxisAngle(rotation, [0, 1, 0], rotationY)
    vec3.transformQuat(cam_dir, cam_dir, rotation)
    quat.setAxisAngle(rotation, cam_right, rotationX)
    vec3.transformQuat(cam_dir, cam_dir, rotation)

    vec3.add(uniform_editor_overrides["u_cam_target"], uniform_editor_overrides["u_cam_pos"], cam_dir)

    self.drawFrame()
  }
  
  this.overrideUniform = function(name, value) {
    uniform_editor_overrides[name] = value
    self.drawFrameIfNotPlaying()
  }
  
  this.removeUniformOverride = function(name) {
    delete uniform_editor_overrides[name]
    self.drawFrameIfNotPlaying()
  }
})
