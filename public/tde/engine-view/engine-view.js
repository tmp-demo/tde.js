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
        demo.start_time = audioContext.currentTime * 1000 - this.value
      })
      
      setInterval(function()
      {
        seeker.val(audioContext.currentTime * 1000 - demo.start_time)
        
        // compute start time for each scene
        var time_sum = 0
        for (var s=0;s<demo.scenes.length;++s)
        {
          demo.scenes[s].start_time = time_sum
          time_sum += demo.scenes[s].duration
        }
        demo.end_time = time_sum
        seeker.attr("max", time_sum)
      }, 50)
      
      element.find("canvas").dblclick(function()
      {
        this.requestFullScreen = this.requestFullScreen || this.mozRequestFullScreen || this.webkitRequestFullScreen
        this.requestFullScreen()
      })
    }
  }
})
