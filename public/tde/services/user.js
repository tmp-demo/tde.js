angular.module("tde.services.user", [])

// cookie-based login service (the client is fully trusted)
.service("User", function()
{
  this.currentUser = {
    name: "plop",
    email: "plop@plop.net"
  }
  
  this.login = function(name, email)
  {
    this.currentUser.name = username
    this.currentUser.email = email
  }
  
  this.logout = function()
  {
    this.currentUser.name = null
    this.currentUser.email = null
  }
})
