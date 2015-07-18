NodeList.prototype.forEach = Array.prototype.forEach;

angular.module("tde", [
  "ngAnimate",
  "ngRoute",
  "ngSanitize",
  "tde.blender-box",
  "tde.code-editor",
  "tde.engine-view",
  "tde.goto-box",
  "tde.home",
  "tde.navbar",
  "tde.project",
  "tde.timeline",
  "tde.services.asset",
  "tde.services.blender",
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
      // hack to edit the track until we have a proper snd edito
      if (assetType == "snd") assetType = "seq"
      return "/tde/project/" + assetType + "-editor/" + assetType + "-editor.html"
    },
    controller: "ProjectCtrl",
    reloadOnSearch: false
  })
  $routeProvider.otherwise({redirectTo: "/"})
}])

.controller("ApplicationCtrl", function($scope, $routeParams, $location, User, EngineDriver)
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
  $scope.currentSequence = EngineDriver.sequenceInfo
  
  $scope.$on("hideBox", function(event)
  {
    $scope.visibleBox = null;
  })
  
  $(window).keydown(function(event)
  {
    function toggle(boxName) {
      if ($scope.visibleBox === boxName)
        $scope.visibleBox = null;
      else
        $scope.visibleBox = boxName;
    }
    
    $scope.$apply(function()
    {
      if (event.ctrlKey && event.keyCode == 66 /* b */) {
        event.preventDefault();
        toggle("blender-box");
      }

      if (event.ctrlKey && event.keyCode == 80 /* p */) {
        event.preventDefault();
        toggle("goto-box");
      }

      if (event.keyCode == 27 /* Esc */) {
        event.preventDefault();
        $scope.visibleBox = null;
      }
    })
  })
})
