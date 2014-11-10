angular.module("tde.project", [
  "tde.project.asset-list",
])

.controller("ProjectCtrl", function($scope, Asset)
{
  $scope.assets = Object.keys(Asset.assets).map(function(asset) {var parts = asset.split("."); return {name: parts[0], type: parts[1]}})
  $scope.$on("assetListChanged", function()
  {
    $scope.assets = Object.keys(Asset.assets).map(function(asset) {var parts = asset.split("."); return {name: parts[0], type: parts[1]}})
  })
})
