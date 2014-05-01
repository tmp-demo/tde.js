var controllers = angular.module("tde.controllers", [])

controllers.controller("ApplicationCtrl", function($scope, $routeParams, Notifications, User)
{
	$scope.$on('$routeChangeSuccess', function()
	{
		$scope.projectId = $routeParams.projectId
		$scope.assetId = $routeParams.assetId
	})
	
	$scope.connected = Notifications.connected
	$scope.$on("connectionStateChanged", function()
	{
		$scope.connected = Notifications.connected
	})
	
	$scope.currentUser = User.currentUser
})

controllers.controller("NavbarCtrl", function($scope, User)
{
	$scope.logout = User.logout
})

controllers.controller("HomeCtrl", function($scope, $http, $routeParams, Project)
{
	$scope.projects = Project.projects
	$scope.$on("projectListChanged", function()
	{
		$scope.projects = Project.projects
	})
	
	$scope.newProject = function()
	{
		$scope.error = ""
		
		if (!$scope.newProjectName)
			return
		
		Project.createProject($scope.newProjectName, function(err)
		{
			if (err)
				$scope.error = err
			else
				$scope.newProjectName = ""
		})
	}
})

controllers.controller("ProjectCtrl", function($scope)
{
})

controllers.controller("AssetListCtrl", function($scope, $http, Asset)
{
	$scope.assets = Asset.assets
	$scope.$on("assetListChanged", function()
	{
		$scope.assets = Asset.assets
		$scope.editedAsset = null
	})
	
	$scope.getActiveClass = function(asset)
	{
		if ($scope.assetId == asset.name)
			return "active"
		else
			return ""
	}
	
	$scope.getIconClass = function(asset)
	{
		var glyphicon = "warning-sign"
		switch (asset.type)
		{
			case "texture": glyphicon = "picture"; break
			case "model": glyphicon = "th-large"; break
			case "sequence": glyphicon = "film"; break
			case "music": glyphicon = "headphones"; break
		}
		
		return "glyphicon glyphicon-" + glyphicon
	}
	
	$scope.selectAsset = function(asset)
	{
		window.location.hash = "#/" + $scope.projectId + "/" + asset.type + "/" + asset.name
	}
	
	$scope.createAsset = function(type)
	{
		Asset.createAsset(type, function(err, asset)
		{
			$scope.selectAsset(asset)
		})
	}
	
	$scope.editedAsset = null
	$scope.tempName = null
	
	$scope.startRename = function(asset)
	{
		$scope.editedAsset = asset
		$scope.tempName = asset.name
	}
	
	$scope.finishRename = function()
	{
		if (!$scope.editedAsset) // called when finish/cancel was already done, but the hidden field loses focus
			return
		
		if ($scope.tempName == "")
		{
			$scope.cancelRename()
			return
		}
		
		$scope.editedAsset.name = $scope.tempName
		
		$scope.selectAsset($scope.editedAsset)
		
		$scope.editedAsset = null
		$scope.tempName = null
	}
	
	$scope.cancelRename = function()
	{
		$scope.editedAsset = null
		$scope.tempName = null
	}
})
