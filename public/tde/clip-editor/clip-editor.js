angular.module("tde.clip-editor", [])

.directive("tdeClipEditor", function()
{
  return {
    restrict: "E",
    templateUrl: "/tde/clip-editor/clip-editor.html",
    scope: {
        clip: "=clip",
        sequence: "=sequence",
        updateSequenceData: "=updateSequenceData",
        exitClip: "=exitClip",
        seek: "=seek"
    },
    link: function($scope, element, attrs)
    {
      var jqCanvas = element.find("canvas")
      var canvas = jqCanvas.get(0)
      var ctx = canvas.getContext("2d")
      
      var clip = {
        start: 0,
        duration: 16,
        animation: []
      }
      var name = ""
      var selectedClips = []

      var RULER_WIDTH = 40
      var RULER_HEIGHT = 20
      
      var scrollX = 0 // px
      var scrollY = 0 // px
      var scaleX = 10 // px/beat
      var scaleY = 10 // px/unit
      var rulerStepX = 4 // beat/unit
      var rulerStepY = 4 // beat/unit
      updateRulerSteps()
      
      function beatToX(beat) { return RULER_WIDTH + scaleX * beat + scrollX }
      function xToBeat(x)    { return (x - scrollX - RULER_WIDTH) / scaleX }
      
      function valueToY(track) { return RULER_HEIGHT + track * scaleY + scrollY }
      function yToValue(y)     { return (y - scrollY - RULER_HEIGHT) / scaleY }

      function snapX(beat) { return Math.round(beat / rulerStepX) * rulerStepX }
      function snapY(value) { return Math.round(value / rulerStepY) * rulerStepY }
      
      function redraw()
      {
        // background
        ctx.fillStyle = "rgb(0, 0, 0)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // grid
        ctx.fillStyle = "rgb(32, 32, 32)"
        for (var i = Math.ceil(xToBeat(RULER_WIDTH) / rulerStepX) * rulerStepX; i < Math.ceil(xToBeat(canvas.width) / rulerStepX) * rulerStepX; i += rulerStepX)
        {
          var x = beatToX(i)
          ctx.fillRect(x, RULER_HEIGHT, 1, canvas.height - RULER_HEIGHT)
        }
        for (var i = Math.ceil(yToValue(RULER_HEIGHT) / rulerStepY) * rulerStepY; i < Math.ceil(yToValue(canvas.height) / rulerStepY) * rulerStepY; i += rulerStepY)
        {
          var y = valueToY(i)
          ctx.fillRect(RULER_WIDTH, y, canvas.width - RULER_WIDTH, 1)
        }

        // dead zones
        if (beatToX(0) > RULER_WIDTH)
        {
          ctx.fillStyle = "rgba(32, 32, 32, 0.5)"
          ctx.fillRect(RULER_WIDTH, RULER_HEIGHT, beatToX(0) - RULER_WIDTH, canvas.height - RULER_HEIGHT)
        }

        if (beatToX(clip.duration) < canvas.width)
        {
          ctx.fillStyle = "rgba(32, 32, 32, 0.5)"
          ctx.fillRect(beatToX(clip.duration), RULER_HEIGHT, canvas.width - beatToX(clip.duration), canvas.height - RULER_HEIGHT)
        }

        function curveColor(component)
        {
          switch (component)
          {
            case 0: return "#f00"
            case 1: return "#0f0"
            case 2: return "#00f"
          }

          return "#fff"
        }

        var engineClip = deep_clone(clip)
        if (engineClip.easing) {
          var eval_str = "ease_" + engineClip.easing;
          engineClip.easing = global_scope[eval_str];
        }

        // curves
        for (var component = 0; component < 2; component++)
        {
          ctx.strokeStyle = curveColor(component)
          ctx.beginPath()
          for (var x = RULER_WIDTH; x < canvas.width; x += 2)
          {
            var y = valueToY(resolve_animation_clip(engineClip, xToBeat(x))[component])
            if (x == RULER_WIDTH)
              ctx.moveTo(x, y)
            else
              ctx.lineTo(x, y)
          }
          ctx.stroke()
        }

        // selection square
        if (selecting)
        {
          ctx.fillStyle = "rgba(200, 215, 237, 0.5)"
          ctx.fillRect(selectionStartX, selectionStartY, selectionEndX - selectionStartX, selectionEndY - selectionStartY)

          ctx.strokeStyle = "rgba(80, 125, 166, 0.8)"
          ctx.strokeRect(selectionStartX, selectionStartY, selectionEndX - selectionStartX, selectionEndY - selectionStartY)
        }

        // time ruler (horizontal)
        ctx.fillStyle = "rgb(20, 20, 20)"
        ctx.fillRect(0, 0, canvas.width, RULER_HEIGHT)
        ctx.font = "8px sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "bottom"
        for (var i = Math.ceil(snapX(xToBeat(0))); i < Math.floor(snapX(xToBeat(canvas.width) + rulerStepX)); i += rulerStepX)
        {
          var x = beatToX(i)
          ctx.fillStyle = "rgb(200, 200, 200)"
          ctx.fillRect(x, RULER_HEIGHT - 5, 1, 5)
          ctx.fillText(i, x, RULER_HEIGHT - 6)
        }

        // time ruler (vertical)
        ctx.fillStyle = "rgb(20, 20, 20)"
        ctx.fillRect(0, 0, RULER_WIDTH, canvas.height)
        ctx.font = "8px sans-serif"
        ctx.textAlign = "right"
        ctx.textBaseline = "middle"
        for (var i = Math.ceil(snapY(yToValue(0))); i < Math.floor(snapY(yToValue(canvas.height) + rulerStepY)); i += rulerStepY)
        {
          var y = valueToY(i)
          ctx.fillStyle = "rgb(200, 200, 200)"
          ctx.fillRect(RULER_WIDTH - 5, y, 5, 1)
          ctx.fillText(i, RULER_WIDTH - 6, y)
        }

        // back button
        ctx.fillStyle = "rgb(40, 40, 40)"
        ctx.fillRect(0, 0, RULER_WIDTH, RULER_HEIGHT)
        ctx.font = "12px sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillStyle = "rgb(200, 200, 200)"
        ctx.fillText("back", RULER_WIDTH / 2, RULER_HEIGHT / 2)

        // time marker
        var markerX = beatToX($scope.sequence.time - clip.start)
        if ((markerX >= RULER_WIDTH) && (markerX <= canvas.width))
        {
          ctx.fillStyle = "rgb(200, 200, 200)"
          ctx.fillRect(markerX - 1, RULER_HEIGHT, 2, canvas.height - RULER_HEIGHT)
        }
      }

      redraw()
      
      function seek(time)
      {
        $scope.$apply(function()
        {
          time = Math.max(0, time + clip.start)
          $scope.sequence.time = time
          $scope.seek(time)
        })
      }

      function findClip(x, y)
      {
        if (x < RULER_WIDTH) return null
        if (y < RULER_HEIGHT) return null

        var trackIndex = Math.floor(yToValue(y))
        if (trackIndex < 0) return null
        if (trackIndex >= Object.keys(tracks).length) return null

        var beat = xToBeat(x)
        var track = tracks[Object.keys(tracks)[trackIndex]]
        for (var i = 0; i < track.length; i++)
        {
          var clip = track[i]
          var end = clip.start + clip.duration

          if ((beat >= clip.start) && (beat < end))
            return clip
        }

        return null
      }

      function findClipsInRectangle(x1, y1, x2, y2)
      {
        if (x2 < x1)
        {
          var tmp = x1
          x1 = x2
          x2 = tmp
        }

        if (y2 < y1)
        {
          var tmp = y1
          y1 = y2
          y2 = tmp
        }

        var clips = []

        var trackNames = Object.keys(tracks)
        var minTrack = Math.max(Math.floor(yToValue(y1)), 0)
        var maxTrack = Math.min(Math.floor(yToValue(y2)), trackNames.length - 1)

        for (var i = minTrack; i <= maxTrack; i++)
        {
          var track = tracks[trackNames[i]]
          track.forEach(function(clip)
          {
            if ((x1 < beatToX(clip.start + clip.duration)) && (x2 > beatToX(clip.start)))
              clips.push(clip)
          })
        }

        return clips
      }

      function updateRulerSteps()
      {
        rulerStepX = 1
        while (scaleX * rulerStepX < 20)
          rulerStepX *= 2

        rulerStepY = 1
        while (scaleY * rulerStepY < 20)
          rulerStepY *= 2
      }

      var panning = false
      var seeking = false
      var dragging = false
      var dragOffset = 0
      var zooming = false
      var selecting = false
      var selectionStartX = 0
      var selectionStartY = 0
      var selectionEndX = 0
      var selectionEndY = 0
      canvas.addEventListener("mousedown", function(event)
      {
        if (event.button == 0 /* left */)
        {
          // back button
          if ((event.pageX - jqCanvas.offset().left < RULER_WIDTH) && (event.pageY - jqCanvas.offset().top < RULER_HEIGHT))
          {
            $scope.exitClip()
            return
          }

          var clip = findClip(event.pageX - jqCanvas.offset().left, event.pageY - jqCanvas.offset().top)

          // replace selection
          if (!event.shiftKey && (selectedClips.indexOf(clip) == -1))
          {
            if (clip)
              selectedClips = [clip]
            else
              selectedClips = []
          }

          // modify selection
          if (event.shiftKey && clip)
          {
            var selectedIndex = selectedClips.indexOf(clip)
            if (selectedIndex == -1)
            {
              // append
              selectedClips.push(clip)
            }
            else
            {
              // remove
              selectedClips.splice(selectedIndex, 1)
            }
          }

          if (selectedClips.length > 0)
          {
            dragging = true
            dragOffset = 0
          }
          else
          {
            selecting = true
            selectionStartX = event.pageX - jqCanvas.offset().left
            selectionStartY = event.pageY - jqCanvas.offset().top
            selectionEndX = selectionStartX
            selectionEndY = selectionStartY
          }
        }

        if (event.button == 1 /* middle */)
        {
          if (event.ctrlKey)
            zooming = true
          else
            panning = true
        }

        if (event.button == 2 /* right */)
        {
            seeking = true
            seek(xToBeat(event.pageX - jqCanvas.offset().left))
        }

        redraw()
      })
      
      window.addEventListener("mouseup", function(event)
      {
        if (dragging)
        {
          dragOffset = snapX(dragOffset)
          if (Math.abs(dragOffset) > 0)
          {
            selectedClips.forEach(function(clip)
            {
              clip.start += dragOffset
            })
            dragOffset = 0
            $scope.updateSequenceData($scope.sequence.data)
          }
        }

        panning = false
        seeking = false
        dragging = false
        zooming = false
        selecting = false

        redraw()
      })
      
      window.addEventListener("mousemove", function(event)
      {
        if (seeking)
          seek(xToBeat(event.pageX - jqCanvas.offset().left))

        if (panning)
        {
          scrollX += event.movementX
          scrollY += event.movementY
        }

        if (dragging)
        {
          dragOffset += event.movementX / scaleX
        }

        if (zooming)
        {
          var newScaleX = Math.min(Math.max(scaleX + event.movementX, 1), 100)
          var newScaleY = Math.min(Math.max(scaleY - event.movementY, 5), 50)
          
          scrollX = (scrollX - canvas.width / 2) * newScaleX / scaleX + canvas.width / 2
          scrollY = (scrollY - canvas.height / 2) * newScaleY / scaleY + canvas.height / 2
          
          scaleX = newScaleX
          scaleY = newScaleY

          updateRulerSteps()
        }

        if (selecting)
        {
          selectionEndX = event.pageX - jqCanvas.offset().left
          selectionEndY = event.pageY - jqCanvas.offset().top

          selectedClips = findClipsInRectangle(selectionStartX, selectionStartY, selectionEndX, selectionEndY)
        }
        
        redraw()
      })
      
      canvas.addEventListener("wheel", function(event)
      {
        var localX = event.pageX - jqCanvas.offset().left
        var centerBeat = xToBeat(localX)

        scaleX -= event.deltaY
        scaleX = Math.max(1, scaleX)
        scaleX = Math.min(100, scaleX)

        updateRulerSteps()
        scrollX -= beatToX(centerBeat) - localX

        redraw()
      })

      canvas.addEventListener("dblclick", function(event)
      {
        var trackNames = Object.keys(tracks)
        var trackIndex = Math.floor(yToValue(event.pageY - jqCanvas.offset().top))
        var clip = findClip(event.pageX - jqCanvas.offset().left, event.pageY - jqCanvas.offset().top)

        if (event.pageX - jqCanvas.offset().left <= RULER_WIDTH)
        {
          if ((trackIndex < 0) || (trackIndex >= trackNames.length))
          {
            // create new track
            var newTrackName = prompt("New track name", "track42")
            if (newTrackName)
            {
              if (tracks.hasOwnProperty(newTrackName))
              {
                alert("This track name already exists!")
                return
              }

              tracks[newTrackName] = []
              $scope.updateSequenceData($scope.sequence.data)
            }
          }
          else
          {
            // rename track
            var newTrackName = prompt("Track name", trackNames[trackIndex])
            if (newTrackName)
            {
              var otherIndex = trackNames.indexOf(newTrackName)
              if ((otherIndex != -1) && (otherIndex != trackIndex))
              {
                alert("This track name already exists!")
                return
              }

              tracks[newTrackName] = tracks[trackNames[trackIndex]]
              delete tracks[trackNames[trackIndex]]
              $scope.updateSequenceData($scope.sequence.data)
            }
          }

          return;
        }

        if (clip)
        {
          // edit clip content
          if (clip.evaluate)
          {
            var newExpression = prompt("Expression", clip.evaluate)
            if (newExpression)
            {
              clip.evaluate = newExpression
              $scope.updateSequenceData($scope.sequence.data)
            }
          }
          else
          {
            // startup a dedicated clip editor
            $scope.selectClip(clip)
          }
        }
        else
        {
          // create new clip
          if (trackIndex < 0) return
          if (trackIndex >= trackNames.length) return

          var newClip = {
            start: snapX(xToBeat(event.pageX - jqCanvas.offset().left) - rulerStepX * 0.5),
            duration: 2 * rulerStepX,
          }

          if (event.shiftKey)
            newClip.evaluate = "[t]"
          else
            newClip.animation = []

          tracks[trackNames[trackIndex]].push(newClip)
          $scope.updateSequenceData($scope.sequence.data)
        }
      })

      canvas.addEventListener("keyup", function(event)
      {
        if (event.keyCode == 46 /* del */)
        {
          // delete everything selected
          for (var name in tracks)
          {
            var track = tracks[name]
            tracks[name] = track.filter(function(clip)
            {
              return selectedClips.indexOf(clip) == -1
            })
          }
          selectedClips = []
          $scope.updateSequenceData($scope.sequence.data)
        }
      })

      function resize()
      {
        canvas.width = $("#timeline").width()
        canvas.height = $("#timeline").height()
        redraw()
      }

      window.addEventListener("resize", resize)
      resize()

      $scope.$watch("clip", function(newClip)
      {
        if (newClip)
          clip = newClip

        redraw()
      }, true)

      $scope.$watch("sequence.time", redraw)
    }
  }
})
