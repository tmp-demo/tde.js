angular.module("tde", [
	"ngAnimate",
	"ngRoute",
	"tde.engine-view",
	"tde.home",
	"tde.navbar",
	"tde.project",
	"tde.directives",
	"tde.services"
])

.config(["$routeProvider", function($routeProvider)
{
	$routeProvider.when("/", {templateUrl: "/tde/home/home.html", controller: "HomeCtrl"})
	$routeProvider.when("/:projectId", {templateUrl: "/tde/project/project.html", controller: "ProjectCtrl"})
	$routeProvider.when("/:projectId/texture/:assetId", {templateUrl: "/tde/project/texture-editor/texture-editor.html", controller: "ProjectCtrl"})
	$routeProvider.when("/:projectId/model/:assetId", {templateUrl: "/tde/project/model-editor/model-editor.html", controller: "ProjectCtrl"})
	$routeProvider.when("/:projectId/sequence/:assetId", {templateUrl: "/tde/project/model-editor/model-editor.html", controller: "ProjectCtrl"})
	$routeProvider.when("/:projectId/music/:assetId", {templateUrl: "/tde/project/model-editor/model-editor.html", controller: "ProjectCtrl"})
	$routeProvider.otherwise({redirectTo: "/"})
}])

.controller("ApplicationCtrl", function($scope, $routeParams, Notifications, User)
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
