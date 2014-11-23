angular.module("tde.services.project", [])

.service("Project", function($rootScope, $http)
{
  this.projects = []
  
  var self = this
  this.refreshProjectList = function()
  {
    $http.get("/data/projects").success(function(data)
    {
      self.projects = data
      $rootScope.$broadcast("projectListChanged")
    })
  }
  
  this.createProject = function(name, callback)
  {
    var self = this
    $http.post("/data/projects", {name: name}).
      success(function()
      {
        self.refreshProjectList()
        if (callback)
          callback(null)
      }).
      error(function(error)
      {
        if (callback)
          callback(error)
      })
  }
  
  this.refreshProjectList()
})
