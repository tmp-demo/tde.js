angular.module("tde.navbar", [])

.controller("NavbarCtrl", function($scope, User)
{
	$scope.logout = User.logout
})

.directive("tdeNavbar", function()
{
	return {
		restrict: "E",
		templateUrl: "/tde/navbar/navbar.html"
	}
})
