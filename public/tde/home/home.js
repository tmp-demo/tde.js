angular.module("tde.home", [])

.controller("HomeCtrl", function($scope, $http, $routeParams, Project)
{
  $scope.projects = Project.projects
  $scope.$on("projectListChanged", function()
  {
    $scope.projects = Project.projects
  })
  
  $scope.newProject = function()
  {
    $scope.error = ""
    
    if (!$scope.newProjectName)
      return
    
    Project.createProject($scope.newProjectName, function(err)
    {
      if (err)
        $scope.error = err
      else
        $scope.newProjectName = ""
    })
  }
})
