angular.module("tde.engine-view", [])

.controller("EngineViewCtrl", function($scope, EngineDriver)
{
  $scope.logBuffer = EngineDriver.logBuffer
  $scope.driver = EngineDriver
})

.directive("tdeEngineView", function(Asset)
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

      var time = sessionStorage.getItem("engineViewTime");
      if (time)
        $scope.driver.seek(parseFloat(time));

      /*subdiv_slider = element.find(".subdiv_param");
      //subdiv_slider.value = num_subdivs;
      subdiv_slider.on("input", function() {
        //num_subdivs = this.value;
        //console.log("Num subdivisions: " + this.value);
        //city_map = document._generate_map();
        //replace_geom(geometries.city, document._generate_city_geom(city_map));
        //$scope.driver.drawFrame();
      })

      perimeter_slider = element.find(".min_perimeter");
      //perimeter_slider.value = MIN_PERIMETER;
      perimeter_slider.on("input", function() {
        //MIN_PERIMETER = this.value;
        //console.log("Perimeter minimum: " + this.value);
        //city_map = document._generate_map();
        //replace_geom(geometries.city, document._generate_city_geom(city_map));
        //$scope.driver.drawFrame();
      })

      shrink_slider = element.find(".subdiv_shrink_coef");
      //shrink_slider.value = SUBDIV_SHRINK_COEF;
      shrink_slider.on("input", function() {
        //SUBDIV_SHRINK_COEF = this.value;
        //console.log("subdivision coefficient when shrinking paths: " + this.value);
        //city_map = document._generate_map();
        //replace_geom(geometries.city, document._generate_city_geom(city_map));
        uniforms["focus"] = [this.value];
        $scope.driver.drawFrame();
      })

      extrude_perimeter_slider = element.find(".extrude_min_perimeter");
      //shrink_slider.value = SUBDIV_SHRINK_COEF;
      extrude_perimeter_slider.on("input", function() {
        //MIN_PERIMETER_EXTRUSION = this.value;
        //console.log("seed: " + this.value);
        //SEED = this.value;
        //city_map = document._generate_map();
        //replace_geom(geometries.city, document._generate_city_geom(city_map));

        $scope.driver.drawFrame();
      })*/

      setInterval(function()
      {
        seeker.val($scope.driver.currentTime * 1000)
        
        $scope.$apply(function() {
          sessionStorage.setItem("engineViewTime", $scope.driver.currentTime);
        });

        // compute start time for each scene
        /*var time_sum = 0
        for (var s=0;s<scenes.length;++s)
        {
          scenes[s].start_time = time_sum
          time_sum += scenes[s].duration
        }*/
        time_sum = 64
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

      var canvasElement = element.find("#engine-view")
      canvasElement.dblclick(function()
      {
        toggleFullscreen(this)
      })

      canvasElement.click(function()
      {
        //togglePlayState()
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

      /*var canvas_map = document.getElementById("map-view")
      map_ctx = canvas_map.getContext("2d");
      map_ctx.fillStyle = "rgb(220, 220, 220)";
      map_ctx.fillRect(0, 0, 640, 500);

      element.find("#map-view").mousemove(function(e)
      {
        if (!("cam_pos" in uniforms))
          return;

        //uniforms["cam_pos"][0] = (e.pageX - $("#map-view").offset().left - 150) * 5;
        //uniforms["cam_pos"][2] = (e.pageY - $("#map-view").offset().top - 150) * 5;
        
        var mapX = 0, mapY = 0;
        mouseX = e.pageX - $("#map-view").offset().left;
        mouseY = e.pageY - $("#map-view").offset().top
        if(mouseX >106 &&mouseX  < 574){
          mapX = mouseX -  106;
          mapX = M.round(mapX / 468 * 1400 -700);
          if(mouseY >7 &&mouseY  < 473){
            mapY = mouseY -  7;
            mapY = M.round(- (mapY / 466 * 1400 -700)) ;
            
            element.find("#map-coords")[0].innerHTML = "["+mapX+","+mapY+"]";
          }
        }
        

        $scope.driver.drawFrame();
      })*/
    }
  }
})
