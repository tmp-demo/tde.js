angular.module("tde.services.user", [])

// cookie-based login service (the client is fully trusted)
.service("User", function()
{
	this.currentUser = {
		name: "plop"
	}
	
	this.login = function(username)
	{
		this.currentUser.name = username
	}
	
	this.logout = function()
	{
		this.currentUser.name = null
	}
})
