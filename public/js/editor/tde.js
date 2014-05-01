var app = angular.module("tde", [
	"ngAnimate",
	"ngRoute",
	"tde.controllers",
	"tde.directives",
	"tde.services"
])

app.config(["$routeProvider", function($routeProvider)
{
	$routeProvider.when("/", {templateUrl: "partials/home.html", controller: "HomeCtrl"})
	$routeProvider.when("/:projectId", {templateUrl: "partials/project.html", controller: "ProjectCtrl"})
	$routeProvider.when("/:projectId/texture/:assetId", {templateUrl: "partials/texture-editor.html", controller: "ProjectCtrl"})
	$routeProvider.when("/:projectId/model/:assetId", {templateUrl: "partials/model-editor.html", controller: "ProjectCtrl"})
	$routeProvider.when("/:projectId/sequence/:assetId", {templateUrl: "partials/model-editor.html", controller: "ProjectCtrl"})
	$routeProvider.when("/:projectId/music/:assetId", {templateUrl: "partials/model-editor.html", controller: "ProjectCtrl"})
	$routeProvider.otherwise({redirectTo: "/"})
}])
