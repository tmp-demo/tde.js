angular.module("tde.timeline", [])

.directive("tdeTimeline", function()
{
  return {
    restrict: "E",
    templateUrl: "/tde/timeline/timeline.html",
    scope: {
        sequence: "=sequence",
        updateSequenceData: "=updateSequenceData",
        seek: "=seek"
    },
    link: function($scope, element, attrs)
    {
      var jqCanvas = element.find("canvas")
      var canvas = jqCanvas.get(0)
      var ctx = canvas.getContext("2d")
      
      var tracks = {}
      var name = ""
      var selectedClips = []

      var HEADER_WIDTH = 100
      var RULER_HEIGHT = 20
      
      var scrollX = 0 // px
      var scrollY = 0 // px
      var scaleX = 10 // px/beat
      var scaleY = 30 // px/track
      var rulerStep = 4 // beat/unit
      
      function beatToX(beat) { return HEADER_WIDTH + scaleX * beat + scrollX }
      function xToBeat(x)    { return (x - scrollX - HEADER_WIDTH) / scaleX }
      
      function trackToY(track) { return RULER_HEIGHT + track * scaleY + scrollY }
      function yToTrack(y)     { return (y - scrollY - RULER_HEIGHT) / scaleY }

      function snap(beat) { return Math.round(beat / rulerStep) * rulerStep }
      
      function redraw()
      {
        // background
        ctx.fillStyle = "rgb(0, 0, 0)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // left pane
        ctx.fillStyle = "rgb(20, 20, 20)"
        ctx.fillRect(0, RULER_HEIGHT, HEADER_WIDTH, canvas.height - RULER_HEIGHT)
        
        // grid
        for (var i = Math.ceil(xToBeat(HEADER_WIDTH) / rulerStep) * rulerStep; i < Math.ceil(xToBeat(canvas.width) / rulerStep) * rulerStep; i += rulerStep)
        {
          var x = beatToX(i)
          ctx.fillStyle = "rgb(64, 64, 64)"
          ctx.fillRect(x, RULER_HEIGHT, 1, canvas.height - RULER_HEIGHT)
        }

        if (beatToX(0) > HEADER_WIDTH)
        {
          ctx.fillStyle = "rgba(32, 32, 32, 0.5)"
          ctx.fillRect(HEADER_WIDTH, RULER_HEIGHT, beatToX(0) - HEADER_WIDTH, canvas.height - RULER_HEIGHT)
        }

        // track slots
        for (var i = Math.ceil(yToTrack(RULER_HEIGHT)); i < Math.ceil(yToTrack(canvas.height)); i++)
        {
          var y = trackToY(i)
          ctx.fillStyle = "rgb(32, 32, 32)"
          ctx.fillRect(0, y, canvas.width, 1)
        }
        
        // tracks
        var trackNames = Object.keys(tracks)
        for (var i = Math.max(0, Math.floor(yToTrack(RULER_HEIGHT))); i < Math.min(trackNames.length, Math.ceil(yToTrack(canvas.height))); i++)
        {
          var track = tracks[trackNames[i]]
          var y = trackToY(i)
          
          // clips
          track.forEach(function(clip)
          {
            var selected = selectedClips.indexOf(clip) != -1;

            var start = clip.start
            if (selected)
              start += snap(dragOffset)

            var end = start + clip.duration
            if (start > xToBeat(canvas.width)) return
            if (end < xToBeat(HEADER_WIDTH)) return
            
            var gradient = ctx.createLinearGradient(0, y, 0, y + scaleY)

            if (selected)
            {
              gradient.addColorStop(0, "#8DACBA")
              gradient.addColorStop(1, "#8BA6C4")
            }
            else
            {
              gradient.addColorStop(0, "#6097A8")
              gradient.addColorStop(1, "#526580")
            }
            ctx.fillStyle = gradient
            ctx.fillRect(beatToX(start) + 1, y + 1, clip.duration * scaleX - 2, scaleY - 2)

            if (clip.evaluate)
            {
              ctx.font = "12px sans-serif monospace"
              ctx.textAlign = "center"
              ctx.textBaseline = "middle"
              ctx.fillStyle = "#cef"
              ctx.fillText(clip.evaluate, beatToX(start + clip.duration * 0.5), y + scaleY / 2, beatToX(end) - beatToX(start))
            }
          })
          
          ctx.fillStyle = "rgb(20, 20, 20)"
          ctx.fillRect(0, y, HEADER_WIDTH, scaleY)
          
          ctx.fillStyle = "rgb(20, 20, 64)"
          ctx.fillRect(0, y + 1, HEADER_WIDTH, 1)
          ctx.fillStyle = "rgb(100, 150, 200)"
          ctx.fillRect(0, y, HEADER_WIDTH, 1)

          ctx.font = "12px sans-serif"
          ctx.textAlign = "left"
          ctx.textBaseline = "middle"
          ctx.fillText(trackNames[i], 10, y + scaleY / 2, HEADER_WIDTH - 20)
        }
        
        // selection square
        if (selecting)
        {
          ctx.fillStyle = "rgba(200, 215, 237, 0.5)"
          ctx.fillRect(selectionStartX, selectionStartY, selectionEndX - selectionStartX, selectionEndY - selectionStartY)

          ctx.strokeStyle = "rgba(80, 125, 166, 0.8)"
          ctx.strokeRect(selectionStartX, selectionStartY, selectionEndX - selectionStartX, selectionEndY - selectionStartY)
        }

        // time ruler
        ctx.fillStyle = "rgb(20, 20, 20)"
        ctx.fillRect(0, 0, canvas.width, RULER_HEIGHT)
        ctx.font = "8px sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "bottom"
        for (var i = Math.ceil(snap(xToBeat(0))); i < Math.floor(snap(xToBeat(canvas.width) + rulerStep)); i += rulerStep)
        {
          var x = beatToX(i)
          ctx.fillStyle = "rgb(200, 200, 200)"
          ctx.fillRect(x, RULER_HEIGHT - 5, 1, 5)
          ctx.fillText(i, x, RULER_HEIGHT - 6)
        }

        // name
        ctx.fillStyle = "rgb(40, 40, 40)"
        ctx.fillRect(0, 0, HEADER_WIDTH, RULER_HEIGHT)
        ctx.font = "12px sans-serif"
        ctx.textAlign = "left"
        ctx.textBaseline = "middle"
        ctx.fillStyle = "rgb(200, 200, 200)"
        ctx.fillText("[ " + name + " ]", 10, RULER_HEIGHT / 2)

        // time marker
        var markerX = beatToX($scope.sequence.time)
        if ((markerX >= HEADER_WIDTH) && (markerX <= canvas.width))
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
          time = Math.max(0, time)
          $scope.sequence.time = time
          $scope.seek(time)
        })
      }

      function findClip(x, y)
      {
        if (x < HEADER_WIDTH) return null
        if (y < RULER_HEIGHT) return null

        var trackIndex = Math.floor(yToTrack(y))
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
        var minTrack = Math.max(Math.floor(yToTrack(y1)), 0)
        var maxTrack = Math.min(Math.floor(yToTrack(y2)), trackNames.length - 1)

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

      function updateRulerStep()
      {
        rulerStep = 1
        while (scaleX * rulerStep < 30)
          rulerStep *= 2
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
          dragOffset = snap(dragOffset)
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

          updateRulerStep()
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

        updateRulerStep()
        scrollX -= beatToX(centerBeat) - localX

        redraw()
      })

      canvas.addEventListener("dblclick", function(event)
      {
        var trackNames = Object.keys(tracks)
        var trackIndex = Math.floor(yToTrack(event.pageY - jqCanvas.offset().top))
        var clip = findClip(event.pageX - jqCanvas.offset().left, event.pageY - jqCanvas.offset().top)

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
          }
        }
        else
        {
          // create new clip
          if (trackIndex < 0) return
          if (trackIndex >= trackNames.length) return

          var newClip = {
            start: snap(xToBeat(event.pageX - jqCanvas.offset().left) - rulerStep * 0.5),
            duration: 2 * rulerStep,
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
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
        redraw()
      }

      window.addEventListener("resize", resize)
      resize()

      $scope.$watch("sequence", function(newSequence, oldSequence)
      {
        tracks = $scope.sequence.data.hasOwnProperty("animations") ? $scope.sequence.data.animations : {}
        name = $scope.sequence.name
        redraw()
      }, true)
    }
  }
})
