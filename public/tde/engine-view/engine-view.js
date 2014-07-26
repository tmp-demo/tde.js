angular.module("tde.engine-view", [])

.controller("EngineViewCtrl", function($scope, EngineDriver)
{
  $scope.logBuffer = EngineDriver.logBuffer
})

.directive("tdeEngineView", function()
{
  return {
    restrict: "E",
    templateUrl: "/tde/engine-view/engine-view.html",
    link: function($scope, element, attrs)
    {
      editor_main()
      
      var seeker = element.find(".seeker")
      seeker.on("input", function()
      {
        demo.start_time = audioContext.currentTime - this.value / 1000
      })
      
      setInterval(function()
      {
        seeker.val((audioContext.currentTime - demo.start_time) * 1000)
        
        // compute start time for each scene
        var time_sum = 0
        for (var s=0;s<demo.scenes.length;++s)
        {
          demo.scenes[s].start_time = time_sum
          time_sum += demo.scenes[s].duration
        }
        demo.end_time = time_sum
        seeker.attr("max", time_sum * 1000)
      }, 50)
      
      element.find("canvas").dblclick(function()
      {
        this.requestFullScreen = this.requestFullScreen || this.mozRequestFullScreen || this.webkitRequestFullScreen
        this.requestFullScreen()
      })
    }
  }
})
