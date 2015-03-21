angular.module("tde.services.user", [])

// cookie-based login service (the client is fully trusted)
.service("User", function(EngineDriver)
{
  var self = this

  this.loadPrefs = function()
  {
    self.prefs = {
      blenderOverride: false,
      blenderPlay: false,
      blenderPlayScene: "Scene",
      blenderUniforms: [],
      blenderUrl: "ws://localhost:8137/",
      mute: false
    }
    
    try {
      angular.extend(self.prefs, JSON.parse(localStorage["prefs"]))
    } catch (err) {
      console.error(err);
    }
    
    self.applyPrefs()
  }

  this.applyPrefs = function()
  {
    if (self.prefs.mute)
      EngineDriver.mute()
    else
      EngineDriver.unmute()

    self.saveData()
  }

  this.login = function(name, email)
  {
    self.currentUser.name = name
    self.currentUser.email = email
    self.saveData()
  }
  
  this.logout = function()
  {
    self.currentUser.name = null
    self.currentUser.email = null
    self.saveData()
  }
  
  this.saveData = function()
  {
    document.cookie = "name=" + (self.currentUser.name ? self.currentUser.name : "")
    document.cookie = "email=" + (self.currentUser.email ? self.currentUser.email : "")
    
    if (self.currentUser.name)
      localStorage["name"] = self.currentUser.name
    else
      delete localStorage["name"]
    
    if (self.currentUser.email)
      localStorage["email"] = self.currentUser.email
    else
      delete localStorage["email"]

    var prefs = angular.extend({}, self.prefs)
    prefs.blenderUniforms = prefs.blenderUniforms.map(function(uniform) {
      return {
        name: uniform.name,
        expression: uniform.expression
      }
    })
    
    localStorage["prefs"] = JSON.stringify(prefs)
  }
  
  this.currentUser = {
    name: localStorage["name"],
    email: localStorage["email"]
  }
  
  this.loadPrefs()
  this.saveData()
})
