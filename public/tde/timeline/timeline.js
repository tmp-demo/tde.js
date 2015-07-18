angular.module("tde.timeline", [])

.directive("tdeTimeline", function()
{
  return {
    restrict: "E",
    templateUrl: "/tde/timeline/timeline.html",
    scope: {
        sequence: "=sequence"
    },
    link: function($scope, element, attrs)
    {
      var tracks = {}

      var canvas = element.find("canvas").get(0)
      var ctx = canvas.getContext("2d")
      
      var HEADER_WIDTH = 100
      var RULER_HEIGHT = 20
      var TRACK_HEIGHT = 30
      
      var scrollX = 0 // px
      var scrollY = 0 // px
      var scale = 10 // px/beat
      
      function beatToX(beat) { return HEADER_WIDTH + scale * beat + scrollX }
      function xToBeat(x)    { return (x - scrollX - HEADER_WIDTH) / scale }
      
      function trackToY(track) { return RULER_HEIGHT + track * TRACK_HEIGHT + scrollY }
      function yToTrack(y)     { return (y - scrollY - RULER_HEIGHT) / TRACK_HEIGHT }
      
      function redraw()
      {
        ctx.fillStyle = "rgb(0, 0, 0)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        ctx.fillStyle = "rgb(20, 20, 20)"
        ctx.fillRect(0, RULER_HEIGHT, HEADER_WIDTH, canvas.height - RULER_HEIGHT)
        
        // grid
        for (var i = Math.ceil(xToBeat(HEADER_WIDTH) / 16.0) * 16.0; i < Math.ceil(xToBeat(canvas.width) / 16.0) * 16.0; i += 16)
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
        ctx.font = "12px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        var trackNames = Object.keys(tracks);
        for (var i = Math.max(0, Math.floor(yToTrack(RULER_HEIGHT))); i < Math.min(trackNames.length, Math.ceil(yToTrack(canvas.height))); i++)
        {
          var track = tracks[trackNames[i]]
          var y = trackToY(i)
          
          // clips
          track.forEach(function(clip)
          {
            var end = clip.start + clip.duration
            if (clip.start > xToBeat(canvas.width)) return;
            if (end < xToBeat(HEADER_WIDTH)) return;
            
            var gradient = ctx.createLinearGradient(0, y, 0, y + TRACK_HEIGHT)
            gradient.addColorStop(0, "#6097A8")
            gradient.addColorStop(1, "#526580")
            ctx.fillStyle = gradient
            ctx.fillRect(beatToX(clip.start) + 1, y + 1, clip.duration * scale - 2, TRACK_HEIGHT - 2)
          })
          
          ctx.fillStyle = "rgb(20, 20, 20)"
          ctx.fillRect(0, y, HEADER_WIDTH, TRACK_HEIGHT)
          
          ctx.fillStyle = "rgb(20, 20, 64)"
          ctx.fillRect(0, y + 1, HEADER_WIDTH, 1)
          ctx.fillStyle = "rgb(100, 150, 200)"
          ctx.fillRect(0, y, HEADER_WIDTH, 1)
          ctx.fillText(trackNames[i], 10, y + TRACK_HEIGHT / 2, HEADER_WIDTH - 20);
        }
        
        // time ruler
        ctx.fillStyle = "rgb(20, 20, 20)"
        ctx.fillRect(0, 0, canvas.width, RULER_HEIGHT)
        ctx.font = "8px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        for (var i = Math.ceil(xToBeat(0)); i < Math.floor(xToBeat(canvas.width)); i++)
        {
          var x = beatToX(i)
          ctx.fillStyle = "rgb(200, 200, 200)"
          ctx.fillRect(x, RULER_HEIGHT - 5, 1, 5)
          ctx.fillText(i, x, RULER_HEIGHT - 6);
        }
      }
      
      redraw()
      
      var panning = false
      canvas.addEventListener("mousedown", function(event)
      {
        if (event.button == 1 /* middle */)
          panning = true
      })
      
      window.addEventListener("mouseup", function(event)
      {
        panning = false
      })
      
      window.addEventListener("mousemove", function(event)
      {
        if (panning)
        {
          scrollX += event.movementX
          scrollY += event.movementY
          redraw()
        }
      })
      
      canvas.addEventListener("wheel", function(event)
      {
        var localX = event.pageX - event.target.offsetWidth
        var centerBeat = xToBeat(localX)
        scale -= event.deltaY
        scrollX -= beatToX(centerBeat) - localX
        redraw()
      })

      function resize()
      {
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
        redraw()
      }

      canvas.addEventListener("resize", resize)
      resize()

      $scope.$watch("sequence", function(sequence)
      {
        if (sequence.data.hasOwnProperty("animations"))
        {
          tracks = sequence.data.animations
          redraw()
        }
      }, true)
    }
  }
})
