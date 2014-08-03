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

      subdiv_slider = element.find(".subdiv_param");
      //subdiv_slider.value = num_subdivs;
      subdiv_slider.on("input", function() {
        num_subdivs = this.value;
        console.log("Num subdivisions: " + this.value);
        city_map = document._generate_map();
        replace_geom(geometries.city, document._generate_city_geom(city_map));
      })

      perimeter_slider = element.find(".min_perimeter");
      //perimeter_slider.value = MIN_PERIMETER;
      perimeter_slider.on("input", function() {
        MIN_PERIMETER = this.value;
        console.log("Perimeter minimum: " + this.value);
        city_map = document._generate_map();
        replace_geom(geometries.city, document._generate_city_geom(city_map));
      })

      shrink_slider = element.find(".subdiv_shrink_coef");
      //shrink_slider.value = SUBDIV_SHRINK_COEF;
      shrink_slider.on("input", function() {
        SUBDIV_SHRINK_COEF = this.value;
        console.log("subdivision coefficient when shrinking paths: " + this.value);
        city_map = document._generate_map();
        replace_geom(geometries.city, document._generate_city_geom(city_map));
      })

      extrude_perimeter_slider = element.find(".extrude_min_perimeter");
      //shrink_slider.value = SUBDIV_SHRINK_COEF;
      extrude_perimeter_slider.on("input", function() {
        MIN_PERIMETER_EXTRUSION = this.value;
        console.log("min perimeter when extruding: " + this.value);
        city_map = document._generate_map();
        replace_geom(geometries.city, document._generate_city_geom(city_map));
      })

      setInterval(function()
      {
        seeker.val($scope.driver.currentTime * 1000)

        // compute start time for each scene
        var time_sum = 0
        for (var s=0;s<scenes.length;++s)
        {
          scenes[s].start_time = time_sum
          time_sum += scenes[s].duration
        }
        seeker.attr("max", time_sum * 1000)
      }, 50)
      
      function togglePlayState()
      {
        var driver = $scope.driver
        if (driver.playing)
          driver.pause()
        else
          driver.play()
      }
      
      function toggleFullscreen(element)
      {
        element.requestFullscreen = element.requestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen || element.msRequestFullscreen
        document.exitFullscreen = document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen
        document.fullscreenElement = document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement
        
        if (document.fullscreenElement) {
          document.exitFullscreen()
          document.fullscreenElement = null
        } else {
          element.requestFullscreen()
        }
      }
      
      var canvasElement = element.find("canvas")
      canvasElement.dblclick(function()
      {
        toggleFullscreen(this)
      })
      
      canvasElement.click(function()
      {
        togglePlayState()
      })
      
      $(document).keypress(function(event)
      {
        if ((event.target.tagName == "INPUT" && event.target.type == "text") || event.target.tagName == "TEXTAREA")
          return
        
        if (event.which == 32) // space
        {
          event.preventDefault()
          togglePlayState()
        }
        
        if (event.which == 70 || event.which == 102) // f
        {
          event.preventDefault()
          toggleFullscreen(canvasElement.get(0))
        }
      })
    }
  }
})
