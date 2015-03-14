angular.module("tde.navbar", [])

.controller("NavbarCtrl", function($scope, User)
{
  $scope.logout = User.logout
  $scope.prefs = User.prefs
  
  $scope.login = function()
  {
    User.login($scope.name, $scope.email)
  }

  $scope.toggleMute = function()
  {
    User.prefs.mute = !User.prefs.mute
    User.applyPrefs()
  }
})

.directive("tdeNavbar", function()
{
  return {
    restrict: "E",
    templateUrl: "/tde/navbar/navbar.html",
    link: function($scope)
    {
      var dialogShown = false
      
      $scope.$watch("currentUser.name", function(name)
      {
        if (!name && !dialogShown)
        {
          $("#loginBox").modal({
            backdrop: "static",
            keyboard: false
          })
          dialogShown = true
        }
        else if (name && dialogShown)
        {
          $("#loginBox").modal("hide")
          dialogShown = false
        }
      })
    }
  }
})
