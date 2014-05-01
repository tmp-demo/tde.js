var services = angular.module("tde.services", [])

// cookie-based login service (the client is fully trusted)
services.service("User", function()
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

// basic socket.io wrapper for push notifications
services.service("Notifications", function($rootScope)
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

services.service("Project", function($rootScope, $http, Notifications)
{
	this.projects = []
	
	var self = this
	this.refreshProjectList = function()
	{
		$http.get("/data/projects").success(function(data)
		{
			self.projects = data
			$rootScope.$broadcast("projectListChanged")
		})
	}
	
	this.createProject = function(name, callback)
	{
		$http.post("/data/projects", {name: name}).
			success(function()
			{
				if (callback)
					callback(null)
			}).
			error(function(error)
			{
				if (callback)
					callback(error)
			})
	}
	
	this.refreshProjectList()
	
	Notifications.on("projectListChanged", function(data)
	{
		self.refreshProjectList()
	})
})

services.service("Asset", function($rootScope, $http, $routeParams, Notifications)
{
	this.assets = []
	this.currentProjectId = ""
	
	var self = this
	this.refreshAssetList = function()
	{
		if ($routeParams.projectId)
		{
			$http.get("/data/project/" + $routeParams.projectId + "/assets").success(function(data) {
				self.assets = data;
				$rootScope.$broadcast("assetListChanged")
			})
		}
	}
	
	this.createAsset = function(type, callback)
	{
		var name = type + Date.now()
		var asset = {name: name, type: type}
		
		$http.post("/data/project/" + $routeParams.projectId + "/assets", asset).
			success(function()
			{
				if (callback)
					callback(null, asset)
			}).
			error(function(error)
			{
				if (callback)
					callback(error, asset)
			})
	}
	
	this.renameAsset = function(asset, newName, callback)
	{
		$http.post("/data/project/" + $routeParams.projectId + "/asset/" + asset.name + "." + asset.type, {rename: newName}).
			success(function()
			{
				if (callback)
					callback(null)
			}).
			error(function(error)
			{
				if (callback)
					callback(error)
			})
	}
	
	$rootScope.$on('$routeChangeSuccess', function()
	{
		if (self.currentProjectId != $routeParams.projectId)
		{
			self.assets = []
			self.currentProjectId = $routeParams.projectId
			$rootScope.$broadcast("assetListChanged")
			self.refreshAssetList()
		}
	})
	
	Notifications.on("assetListChanged", function(data)
	{
		if ($routeParams.projectId == data.projectId)
			self.refreshAssetList()
	})
})
