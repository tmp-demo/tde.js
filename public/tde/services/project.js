angular.module("tde.services.project", [])

.service("Project", function($rootScope, $http)
{
  var self = this;
  this.projects = [];
  
  this.refreshProjectList = function() {
    $http.get("/data/projects")
      .success(function(data) {
        self.projects = data;
        $rootScope.$broadcast("projectListChanged");
      });
  };
  
  this.createProject = function(name, callback) {
    $http.post("/data/projects", {name: name})
      .success(function()
      {
        self.refreshProjectList();
        if (callback)
          callback();
      })
      .error(callback);
  };
  
  this.refreshProjectList();
});
