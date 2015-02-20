angular.module("tde", [
  "ngAnimate",
  "ngRoute",
  "ngSanitize",
  "tde.code-editor",
  "tde.engine-view",
  "tde.goto-box",
  "tde.home",
  "tde.navbar",
  "tde.project",
  "tde.services.asset",
  "tde.services.engine-driver",
  "tde.services.project",
  "tde.services.user"
])

.config(["$routeProvider", function($routeProvider)
{
  $routeProvider.when("/", {
    templateUrl: "/tde/home/home.html",
    controller: "HomeCtrl"
  })
  $routeProvider.when("/:projectId", {
    templateUrl: "/tde/project/project.html",
    controller: "ProjectCtrl"
  })
  $routeProvider.when("/:projectId/:assetType/:assetName", {
    templateUrl: function($routeParams) {
      var assetType = $routeParams.assetType
      if (assetType == "glsllib") assetType = "glsl"
      return "/tde/project/" + assetType + "-editor/" + assetType + "-editor.html"
    },
    controller: "ProjectCtrl",
    reloadOnSearch: false
  })
  $routeProvider.otherwise({redirectTo: "/"})
}])

.controller("ApplicationCtrl", function($scope, $routeParams, $location, User)
{
  $scope.$on('$routeChangeSuccess', function()
  {
    $scope.projectId = $routeParams.projectId
    $scope.assetType = $routeParams.assetType
    $scope.assetName = $routeParams.assetName
    $scope.assetId = $scope.assetName ? $scope.assetName + "." + $scope.assetType : ""
  })

  $scope.$on("gotoBoxItemSelected", function(event, selectedItem)
  {
    var assetParts = selectedItem.split(".");
    $location.url("/" + $scope.projectId + "/" + assetParts[1] + "/" + assetParts[0])
  })
  
  $scope.currentUser = User.currentUser
})
