angular.module("tde.project.asset-list", [])

.controller("AssetListCtrl", function($scope, $http, Asset)
{
  $scope.assets = Object.keys(Asset.assets)
  $scope.$on("assetListChanged", function()
  {
    $scope.assets = Object.keys(Asset.assets)
  })
  
  $scope.getActiveClass = function(asset)
  {
    if ($scope.assetId == asset)
      return "active"
    else
      return ""
  }
  
  $scope.getIconClass = Asset.getIconClass
  
  $scope.selectAsset = function(asset)
  {
    var parts = asset.split(".")
    window.location.hash = "#/" + $scope.projectId + "/" + parts[1] + "/" + parts[0]
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
    $scope.tempName = asset
  }
  
  $scope.finishRename = function()
  {
    if (!$scope.editedAsset) // called when finish/cancel was already done, but the hidden field loses focus
      return
    
    if (($scope.tempName == "") || ($scope.tempName == $scope.editedAsset))
    {
      $scope.cancelRename()
      return
    }
    
    Asset.renameAsset($scope.editedAsset, $scope.tempName, function(err)
    {
      if (err)
      {
        $scope.renameError = true
        return
      }
      
      $scope.selectAsset($scope.tempName)
      $scope.editedAsset = null
      $scope.tempName = null
      $scope.renameError = false
    })
  }
  
  $scope.cancelRename = function()
  {
    $scope.editedAsset = null
    $scope.tempName = null
    $scope.renameError = false
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
