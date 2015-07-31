
var canvas_overlay_text = {
  enabled: true,
  time: 0,
  enable: function() {
    canvas_overlay_text.enabled = true;
    update_canvas_overlay_text();
  },
  disable: function() {
    if (canvas_overlay_text.enabled) {
      canvas_overlay_text.enabled = false;
      dom_overlay_text().innerHTML = "";
    }
  },
  update: function() {
    if (!canvas_overlay_text.enabled) {
      return;
    }

    if (snd) {
      var time = Math.floor(snd.t())
      if (time != canvas_overlay_text.time && !isNaN(time)) {
        dom_overlay_text().innerHTML = "time: " +  time;
        canvas_overlay_text.time = time;
      }
    }
  }
}

function dom_overlay_text() {
  return document.getElementById("canvas-overlay-text");
}


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

        /*if (event.which == 70 || event.which == 102) // f
        {
          event.preventDefault()
          toggleFullscreen(canvasElement.get(0))
        }*/
      })

      var oldX = 0
      var oldY = 0
      function onMouseMove(event)
      {
        var diffX = event.clientX - oldX
        var diffY = event.clientY - oldY
        oldX = event.clientX
        oldY = event.clientY
        $scope.driver.rotateEditorCamera(diffX, diffY)
      }

      var cameraMovementUpdate;
      canvasElement.mousedown(function(event)
      {
        if (event.button != 2)
          return

        $scope.driver.overrideCamera()
        
        oldX = event.clientX
        oldY = event.clientY
        $(document).on("mousemove", onMouseMove)

        cameraMovementUpdate = setInterval(function() {
          var cameraMovement = vec3.create()
          cameraMovingForward && (cameraMovement[2] += -1);
          cameraMovingBackward && (cameraMovement[2] += 1);
          cameraMovingLeft && (cameraMovement[0] += -1);
          cameraMovingRight && (cameraMovement[0] += 1);
          $scope.driver.translateEditorCamera(cameraMovement)
        }, 16)
      })

      $(document).mouseup(function(event)
      {
        $(document).off("mousemove", onMouseMove)
        clearInterval(cameraMovementUpdate)
      })

      $(document).contextmenu(function(event)
      {
        // avoid built-in context menu
        return false
      })

      var cameraMovingForward = false
      var cameraMovingBackward = false
      var cameraMovingLeft = false
      var cameraMovingRight = false
      $(document).keydown(function(event)
      {
        if (String.fromCharCode(event.keyCode) == 'Z') cameraMovingForward = true
        if (String.fromCharCode(event.keyCode) == 'S') cameraMovingBackward = true
        if (String.fromCharCode(event.keyCode) == 'Q') cameraMovingLeft = true
        if (String.fromCharCode(event.keyCode) == 'D') cameraMovingRight = true
        //if (String.fromCharCode(event.keyCode) == ' ') up = true
        //if (String.fromCharCode(event.keyCode) == 'C') down = true
      })

      $(document).keyup(function(event)
      {
        if (event.keyCode == 27) // escape
        {
          $scope.driver.removeCameraOverride()
        }

        if (String.fromCharCode(event.keyCode) == 'Z') cameraMovingForward = false
        if (String.fromCharCode(event.keyCode) == 'S') cameraMovingBackward = false
        if (String.fromCharCode(event.keyCode) == 'Q') cameraMovingLeft = false
        if (String.fromCharCode(event.keyCode) == 'D') cameraMovingRight = false
      })

      /*var canvas_map = document.getElementById("map-view")
      map_ctx = canvas_map.getContext("2d");
      map_ctx.fillStyle = "rgb(220, 220, 220)";
      map_ctx.fillRect(0, 0, 640, 500);

      element.find("#map-view").mousemove(function(e)
      {
        if (!("u_cam_pos" in uniforms))
          return;

        //uniforms["u_cam_pos"][0] = (e.pageX - $("#map-view").offset().left - 150) * 5;
        //uniforms["u_cam_pos"][2] = (e.pageY - $("#map-view").offset().top - 150) * 5;
        
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
