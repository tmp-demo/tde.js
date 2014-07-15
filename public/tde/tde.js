angular.module("tde", [
	"ngAnimate",
	"ngRoute",
	"tde.engine-view",
	"tde.home",
	"tde.navbar",
	"tde.project",
	"tde.services.asset",
	"tde.services.project",
	"tde.services.user"
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

.controller("ApplicationCtrl", function($scope, $routeParams, User)
{
	$scope.$on('$routeChangeSuccess', function()
	{
		$scope.projectId = $routeParams.projectId
		$scope.assetId = $routeParams.assetId
	})
	
	$scope.currentUser = User.currentUser
})
