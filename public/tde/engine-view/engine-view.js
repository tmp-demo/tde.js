angular.module("tde.engine-view", [])

.controller("EngineViewCtrl", function($scope, EngineDriver)
{
  $scope.logBuffer = EngineDriver.logBuffer
  $scope.driver = EngineDriver
})

.directive("tdeEngineView", function()
{
  return {
    restrict: "E",
    templateUrl: "/tde/engine-view/engine-view.html",
    controller: "EngineViewCtrl",
    link: function($scope, element, attrs)
    {
      editor_main()
      
      var seeker = element.find(".seeker")
      seeker.on("input", function()
      {
        $scope.driver.seek(this.value / 1000)
      })
      
      setInterval(function()
      {
        seeker.val($scope.driver.currentTime * 1000)
        
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
      
      var canvasElement = element.find("canvas")
      canvasElement.dblclick(function()
      {
        this.requestFullScreen = this.requestFullScreen || this.mozRequestFullScreen || this.webkitRequestFullScreen
        this.requestFullScreen()
      })
      
      canvasElement.click(function()
      {
        var driver = $scope.driver
        if (driver.playing)
          driver.pause()
        else
          driver.play()
      })
    }
  }
})
