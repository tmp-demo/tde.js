angular.module("tde.project", [
  "tde.project.asset-list",
])

.controller("ProjectCtrl", function($scope, Asset)
{
  function updateAssetList()
  {
    $scope.assets = Object.keys(Asset.assets).map(function(asset)
    {
      var parts = asset.split(".");
      return {
        filename: asset,
        name: parts[0],
        type: parts[1]
      }
    })
  }
  
  updateAssetList()
  $scope.$on("assetListChanged", updateAssetList)
  
  $scope.getTypeIconClass = Asset.getTypeIconClass
})
