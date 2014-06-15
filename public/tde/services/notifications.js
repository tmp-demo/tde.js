angular.module("tde.services.notifications", [])

.service("Notifications", function($rootScope)
{
	var socket = io.connect()
	this.on = function(name, callback)
	{
		socket.on(name, callback)
	}
	
	this.connected = false
	
	var self = this
	socket.on("connect", function()
	{
		$rootScope.$apply(function()
		{
			self.connected = true
			$rootScope.$broadcast("connectionStateChanged")
		})
	})
	
	socket.on("disconnect", function()
	{
		$rootScope.$apply(function()
		{
			self.connected = false
			$rootScope.$broadcast("connectionStateChanged")
		})
	})
})
