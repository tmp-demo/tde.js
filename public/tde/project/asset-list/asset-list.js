angular.module("tde.project.asset-list", [])

.controller("AssetListCtrl", function($scope, $http, Asset)
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

.directive("tdeAssetList", function()
{
	return {
		restrict: "E",
		templateUrl: "/tde/project/asset-list/asset-list.html",
		link: function($scope, element, attrs)
		{
			var scrollables = element.find(".scrollable")
			scrollables.mCustomScrollbar()
			
			function updateScroll()
			{
				setTimeout(function()
				{
					scrollables.mCustomScrollbar("update")
				}, 0)
			}
			$scope.$watch("assets", updateScroll, true)
			$scope.$watch("query", updateScroll)
			
			$scope.$watch("editedAsset", function(newValue, oldValue)
			{
				setTimeout(function()
				{
					element.find(".rename-box").focus().select()
				}, 0)
			})
			
			$scope.checkEscape = function(event)
			{
				if (event.keyCode == 27) // Esc
					$scope.cancelRename()
			}
		}
	}
})
