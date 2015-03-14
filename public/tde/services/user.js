angular.module("tde.services.user", [])

// cookie-based login service (the client is fully trusted)
.service("User", function(EngineDriver)
{
  var self = this

  this.loadPrefs = function()
  {
    var prefs = localStorage["prefs"] || "{}"
    self.prefs = JSON.parse(prefs)
    self.prefs.mute = self.prefs.mute || false
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

    localStorage["prefs"] = JSON.stringify(self.prefs)
  }
  
  this.currentUser = {
    name: localStorage["name"],
    email: localStorage["email"]
  }
  
  this.loadPrefs()
  this.saveData()
})
