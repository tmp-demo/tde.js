angular.module("tde.clip-editor", [])

.directive("tdeClipEditor", function()
{
  return {
    restrict: "E",
    templateUrl: "/tde/clip-editor/clip-editor.html",
    scope: {
        sequence: "=sequence",
        updateSequenceData: "=updateSequenceData",
        exitClip: "=exitClip",
        seek: "=seek",
        uniformName: "=uniformName",
        clipIndex: "=clipIndex",
        engineRedraw: "=engineRedraw"
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
      var selectedKeys = [] // array of [keyIndex, componentIndex]

      var RULER_WIDTH = 40
      var RULER_HEIGHT = 20
      
      var scrollX = 0 // px
      var scrollY = 0 // px
      var scaleX = 10 // px/beat
      var scaleY = 10 // px/unit
      var rulerStepX = 4 // beat/unit
      var rulerStepY = 4 // value/unit
      updateRulerSteps()
      
      function beatToX(beat) { return RULER_WIDTH + scaleX * beat + scrollX }
      function xToBeat(x)    { return (x - scrollX - RULER_WIDTH) / scaleX }
      
      function valueToY(value) { return canvas.height - (value * scaleY - scrollY) }
      function yToValue(y)     { return ((canvas.height - y) + scrollY) / scaleY }

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
        for (var i = Math.floor(yToValue(canvas.height) / rulerStepY) * rulerStepY; i < Math.ceil(yToValue(RULER_HEIGHT) / rulerStepY) * rulerStepY; i += rulerStepY)
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

        function curveColor(component, alpha)
        {
          if (!alpha)
            alpha = 1.0

          switch (component)
          {
            case 0: return "rgba(255, 34, 34, " + alpha + ")"
            case 1: return "rgba(0, 144, 0, " + alpha + ")"
            case 2: return "rgba(68, 68, 255, " + alpha + ")"
            case 3: return "rgba(221, 221, 221, " + alpha + ")"
          }

          return "#fff"
        }

        var engineClip = deep_clone(clip)
        engineClip.animation = applyDrag(engineClip.animation)
        if (engineClip.easing) {
          var eval_str = "ease_" + engineClip.easing;
          engineClip.easing = global_scope[eval_str];
        }

        // curves
        for (var component = 0; component < clip.components; component++)
        {
          ctx.strokeStyle = curveColor(component)
          ctx.beginPath()
          for (var x = RULER_WIDTH; x < canvas.width; x += 10)
          {
            var y = valueToY(resolve_animation_clip(engineClip, xToBeat(x))[component])
            if (x == RULER_WIDTH)
              ctx.moveTo(x, y)
            else
              ctx.lineTo(x, y)
          }
          ctx.stroke()
        }

        // keyframes
        var animations = applyDrag(clip.animation)
        for (var i = 0; i < animations.length; i++)
        {
          var key = animations[i]
          var value = key[1]

          var beat = key[0]
          for (var component = 0; component < clip.components; component++)
          {
            var alpha = 0.3
            var val = value[component]
            if (selectionIndexOf([i, component]) != -1)
            {
              alpha = 1.0
            }

            var x = beatToX(beat)
            var y = valueToY(val)

            ctx.fillStyle = curveColor(component, alpha)
            ctx.fillRect(x - 5, y - 5, 10, 10)

            ctx.strokeStyle = curveColor(component)
            ctx.strokeRect(x - 5, y - 5, 10, 10)
          }
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
        for (var i = Math.floor(snapY(yToValue(canvas.height) - rulerStepY)); i < Math.ceil(snapY(yToValue(0)) + rulerStepY); i += rulerStepY)
        {
          var y = valueToY(i)
          ctx.fillStyle = "rgb(200, 200, 200)"
          ctx.fillRect(RULER_WIDTH - 5, y, 5, 1)
          ctx.fillText(Math.round(i / rulerStepY) * rulerStepY, RULER_WIDTH - 6, y)
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

      function findKey(x, y)
      {
        if (x < RULER_WIDTH) return null
        if (y < RULER_HEIGHT) return null

        for (var i = 0; i < clip.animation.length; i++)
        {
          var key = clip.animation[i]
          var beat = key[0]
          var value = key[1]

          var x2 = beatToX(beat)
          for (var component = 0; component < clip.components; component++)
          {
            var y2 = valueToY(value[component])

            if (Math.sqrt(Math.pow(x - x2, 2.0) + Math.pow(y - y2, 2.0)) < 15)
              return [i, component]
          }
        }

        return null
      }

      function findKeysInRectangle(x1, y1, x2, y2)
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

        var keys = []

        for (var i = 0; i < clip.animation.length; i++)
        {
          var key = clip.animation[i]
          var beat = key[0]
          var value = key[1]

          var xKey = beatToX(beat)
          for (var component = 0; component < clip.components; component++)
          {
            var yKey = valueToY(value[component])

            if ((xKey + 5 >= x1) && (xKey - 5 < x2) && (yKey + 5 >= y1) && (yKey - 5 <= y2))
              keys.push([i, component])
          }
        }

        return keys
      }

      function updateRulerSteps()
      {
        rulerStepX = 1
        while (scaleX * rulerStepX < 20)
          rulerStepX *= 2

        rulerStepY = 0.01
        while (scaleY * rulerStepY < 20)
          rulerStepY *= 10
      }

      function selectionIndexOf(key)
      {
        if (!key)
          return -1

        for (var i = 0; i < selectedKeys.length; i++)
        {
          if ((selectedKeys[i][0] == key[0]) && (selectedKeys[i][1] == key[1]))
            return i
        }

        return -1
      }

      function isKeyIndexSelected(index)
      {
        for (var i = 0; i < selectedKeys.length; i++)
        {
          if (selectedKeys[i][0] == index)
            return true
        }

        return false
      }

      function applyDrag(animations)
      {
        animations = deep_clone(animations)
        for (var i = 0; i < animations.length; i++)
        {
          var key = animations[i]
          var value = key[1]

          if (isKeyIndexSelected(i))
          {
            key[0] += dragOffsetX
          }

          for (var component = 0; component < clip.components; component++)
          {
            if (selectionIndexOf([i, component]) != -1)
              value[component] += dragOffsetY
          }
        }

        return animations
      }

      // focuses everything if nothing is selected
      function focusSelection()
      {
        var emptySelection = (selectedKeys.length === 0)

        // don't try to focus if there's no data
        if (clip.animation.length === 0)
          return

        var minBeat = 1000000
        var maxBeat = -1000000
        var minValue = 1000000
        var maxValue = -1000000
        clip.animation.forEach(function(key, index)
        {
          var beat = key[0]
          var value = key[1]
          for (var i = 0; i < clip.components; i++)
          {
            if (emptySelection || (selectionIndexOf([index, i]) != -1))
            {
              minBeat = Math.min(minBeat, beat)
              maxBeat = Math.max(maxBeat, beat)

              minValue = Math.min(minValue, value[i])
              maxValue = Math.max(maxValue, value[i])
            }
          }
        })

        var duration = maxBeat - minBeat
        var valueRange = maxValue - minValue

        if (duration < 0.01)
        {
          minBeat -= 0.5
          maxBeat += 0.5
          duration = maxBeat - minBeat
        }

        if (valueRange < 0.01)
        {
          minValue -= 0.5
          maxValue += 0.5
          valueRange = maxValue - minValue
        }

        scaleX = (canvas.width - RULER_WIDTH - 20) / duration
        scaleY = (canvas.height - RULER_HEIGHT - 20) / valueRange

        scrollX -= beatToX(minBeat) - RULER_WIDTH - 10
        scrollY -= valueToY(maxValue) - RULER_HEIGHT - 10

        updateRulerSteps()

        redraw()
      }

      function insertKeyframe()
      {
        var newKey = [
          Math.max(0, $scope.sequence.time - clip.start),
          deep_clone(uniforms[$scope.uniformName])
        ]

        clip.animation.push(newKey)
        clip.animation = clip.animation.sort(function(lhs, rhs)
        {
          return lhs[0] - rhs[0]
        })

        $scope.updateSequenceData($scope.sequence.data)
      }

      var panning = false
      var seeking = false
      var dragging = false
      var dragOffsetX = 0
      var dragOffsetY = 0
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

          var key = findKey(event.pageX - jqCanvas.offset().left, event.pageY - jqCanvas.offset().top)

          // replace selection
          if (!event.shiftKey && (selectionIndexOf(key) == -1))
          {
            if (key)
              selectedKeys = [key]
            else
              selectedKeys = []
          }

          // modify selection
          if (event.shiftKey && key)
          {
            var selectedIndex = selectionIndexOf(key)
            if (selectedIndex == -1)
            {
              // append
              selectedKeys.push(key)
            }
            else
            {
              // remove
              selectedKeys.splice(selectedIndex, 1)
            }
          }

          if (selectedKeys.length > 0)
          {
            dragging = true
            dragOffsetX = 0
            dragOffsetY = 0
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
          /*if (event.ctrlKey)
            zooming = true
          else*/
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
          clip.animation = applyDrag(clip.animation)

          dragOffsetX = 0
          dragOffsetY = 0

          $scope.updateSequenceData($scope.sequence.data)
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
          dragOffsetX += event.movementX / scaleX
          dragOffsetY -= event.movementY / scaleY
        }

        if (zooming)
        {
          var newScaleX = Math.min(Math.max(scaleX + event.movementX, 1), 100)
          var newScaleY = Math.min(Math.max(scaleY - event.movementY, 0.1), 1000)
          
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

          selectedKeys = findKeysInRectangle(selectionStartX, selectionStartY, selectionEndX, selectionEndY)
        }
        
        redraw()
      })
      
      canvas.addEventListener("wheel", function(event)
      {
        event.preventDefault()
        var delta = Math.sign(event.deltaY)

        if (!event.ctrlKey)
        {
          var localX = event.pageX - jqCanvas.offset().left
          var centerBeat = xToBeat(localX)

          scaleX *= 1.0 - delta * 0.1
          scaleX = Math.max(1, scaleX)
          scaleX = Math.min(100, scaleX)

          scrollX -= beatToX(centerBeat) - localX
        }
        else
        {
          var localY = event.pageY - jqCanvas.offset().top
          var centerValue = yToValue(localY)

          scaleY *= 1.0 - delta * 0.1
          scaleY = Math.max(0.01, scaleY)
          scaleY = Math.min(1000, scaleY)

          scrollY -= valueToY(centerValue) - localY
        }

        updateRulerSteps()
        redraw()
      })

      canvas.addEventListener("dblclick", function(event)
      {
        var key = findKey(event.pageX - jqCanvas.offset().left, event.pageY - jqCanvas.offset().top)

        if (key)
        {
          // edit key value
          var value = clip.animation[key[0]][1][key[1]]
          var newValue = prompt("New value", value)
          if (newValue)
          {
            clip.animation[key[0]][1][key[1]] = parseFloat(newValue)
            $scope.updateSequenceData($scope.sequence.data)
          }
        }
        else
        {
          // create new key
          seek(xToBeat(event.pageX - jqCanvas.offset().left))
          insertKeyframe()
        }
      })

      canvas.addEventListener("keyup", function(event)
      {
        if (event.keyCode == 46 /* del */)
        {
          // delete everything selected
          for (var i = clip.animation.length - 1; i >= 0; i--)
          {
            if (isKeyIndexSelected(i))
              clip.animation.splice(i, 1)
          }
          selectedKeys = []
          $scope.updateSequenceData($scope.sequence.data)
        }

        if (event.keyCode == 70 /* F */)
        {
          focusSelection()
        }

        if (event.keyCode == 73 /* I */)
        {
          insertKeyframe()
        }

        if (event.keyCode == 27 /* esc */)
        {
          $scope.exitClip()
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

      function getComponentName(component)
      {
        switch (component)
        {
          case 0: return "x"
          case 1: return "y"
          case 2: return "z"
          case 3: return "w"
        }

        return "wtf"
      }

      var gui = null
      var guiValue = null
      var guiControllers = []
      function updateClip()
      {
        if (gui)
        {
          gui.destroy()
          gui = null
          guiValue = null
          guiControllers = []
        }

        if ($scope.sequence.data && $scope.sequence.data.hasOwnProperty("animations") && ($scope.clipIndex != -1))
        {
          clip = $scope.sequence.data.animations[$scope.uniformName][$scope.clipIndex]

          gui = new dat.GUI({
            resizable: false,
            hideable: false
          })

          guiValue = {}
          var uniform = uniforms[$scope.uniformName]
          var folder = gui.addFolder($scope.uniformName)
          for (var i = 0; i < clip.components; i++)
          {
            guiValue[getComponentName(i)] = uniform[i]
            var slider = folder.add(guiValue, getComponentName(i))
            slider.onChange(function(component)
            {
              return function(newValue)
              {
                if (!uniform_editor_overrides[$scope.uniformName])
                  uniform_editor_overrides[$scope.uniformName] = deep_clone(uniforms[$scope.uniformName])

                uniform_editor_overrides[$scope.uniformName][component] = newValue
                $scope.engineRedraw()
              }
            }(i))
            
            guiControllers.push(slider)
          }

          folder.open()
        }

        redraw()
      }

      $scope.$watch("clipIndex", updateClip)
      $scope.$watch("sequence.data", updateClip, true)

      $scope.$watch("sequence.time", function()
      {
        delete uniform_editor_overrides[$scope.uniformName]
        redraw()

        for (var i = 0; i < guiControllers.length; i++)
        {
          guiValue[getComponentName(i)] = uniforms[$scope.uniformName][i]
          guiControllers[i].updateDisplay()
        }
      })
    }
  }
})
