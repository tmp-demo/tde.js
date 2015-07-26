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
      var TRACK_HEIGHT = 30
      
      var scrollX = 0 // px
      var scrollY = 0 // px
      var scale = 10 // px/beat
      var rulerStep = 1 // beat/unit
      
      function beatToX(beat) { return HEADER_WIDTH + scale * beat + scrollX }
      function xToBeat(x)    { return (x - scrollX - HEADER_WIDTH) / scale }
      
      function trackToY(track) { return RULER_HEIGHT + track * TRACK_HEIGHT + scrollY }
      function yToTrack(y)     { return (y - scrollY - RULER_HEIGHT) / TRACK_HEIGHT }

      function snap(beat) { return Math.round(beat / rulerStep) * rulerStep }
      
      function redraw()
      {
        ctx.fillStyle = "rgb(0, 0, 0)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        ctx.fillStyle = "rgb(20, 20, 20)"
        ctx.fillRect(0, RULER_HEIGHT, HEADER_WIDTH, canvas.height - RULER_HEIGHT)
        
        // grid
        for (var i = Math.ceil(xToBeat(HEADER_WIDTH) / rulerStep) * rulerStep; i < Math.ceil(xToBeat(canvas.width) / rulerStep) * rulerStep; i += rulerStep)
        {
            var x = beatToX(i)
            ctx.fillStyle = "rgb(64, 64, 64)"
            ctx.fillRect(x, RULER_HEIGHT, 1, canvas.height - RULER_HEIGHT)
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
            if (start > xToBeat(canvas.width)) return;
            if (end < xToBeat(HEADER_WIDTH)) return;
            
            var gradient = ctx.createLinearGradient(0, y, 0, y + TRACK_HEIGHT)

            if (selected)
            {
              gradient.addColorStop(0, "#B6DDF0")
              gradient.addColorStop(1, "#9AB8DB")
            }
            else
            {
              gradient.addColorStop(0, "#6097A8")
              gradient.addColorStop(1, "#526580")
            }
            ctx.fillStyle = gradient
            ctx.fillRect(beatToX(start) + 1, y + 1, clip.duration * scale - 2, TRACK_HEIGHT - 2)

            if (clip.evaluate)
            {
              ctx.font = "12px sans-serif monospace"
              ctx.textAlign = "center"
              ctx.textBaseline = "middle"
              ctx.fillStyle = "#cef"
              ctx.fillText(clip.evaluate, beatToX(start + clip.duration * 0.5), y + TRACK_HEIGHT / 2, beatToX(end) - beatToX(start))
            }
          })
          
          ctx.fillStyle = "rgb(20, 20, 20)"
          ctx.fillRect(0, y, HEADER_WIDTH, TRACK_HEIGHT)
          
          ctx.fillStyle = "rgb(20, 20, 64)"
          ctx.fillRect(0, y + 1, HEADER_WIDTH, 1)
          ctx.fillStyle = "rgb(100, 150, 200)"
          ctx.fillRect(0, y, HEADER_WIDTH, 1)

          ctx.font = "12px sans-serif"
          ctx.textAlign = "left"
          ctx.textBaseline = "middle"
          ctx.fillText(trackNames[i], 10, y + TRACK_HEIGHT / 2, HEADER_WIDTH - 20);
        }
        
        // time ruler
        ctx.fillStyle = "rgb(20, 20, 20)"
        ctx.fillRect(0, 0, canvas.width, RULER_HEIGHT)
        ctx.font = "8px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        for (var i = Math.ceil(snap(xToBeat(0))); i < Math.floor(snap(xToBeat(canvas.width) + rulerStep)); i += rulerStep)
        {
          var x = beatToX(i)
          ctx.fillStyle = "rgb(200, 200, 200)"
          ctx.fillRect(x, RULER_HEIGHT - 5, 1, 5)
          ctx.fillText(i, x, RULER_HEIGHT - 6);
        }

        // name
        ctx.fillStyle = "rgb(40, 40, 40)"
        ctx.fillRect(0, 0, HEADER_WIDTH, RULER_HEIGHT)
        ctx.font = "12px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgb(200, 200, 200)"
        ctx.fillText("[ " + name + " ]", 10, RULER_HEIGHT / 2);

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
            return clip;
        }

        return null
      }

      var panning = false
      var seeking = false
      var dragging = false
      var dragOffset = 0
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
            var selectedIndex = selectedClips.indexOf(clip);
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
            seeking = true
            seek(xToBeat(event.pageX - jqCanvas.offset().left))
          }

        }
        if (event.button == 1 /* middle */)
          panning = true

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
          dragOffset += event.movementX / scale
        }

        redraw()
      })
      
      canvas.addEventListener("wheel", function(event)
      {
        var localX = event.pageX - jqCanvas.offset().left
        var centerBeat = xToBeat(localX)
        scale -= event.deltaY
        scale = Math.max(1, scale)
        scale = Math.min(100, scale)
        rulerStep = 1
        while (scale * rulerStep < 30)
          rulerStep *= 2
        scrollX -= beatToX(centerBeat) - localX
        redraw()
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
