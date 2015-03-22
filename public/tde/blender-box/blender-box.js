angular.module("tde.blender-box", [])

.directive("tdeBlenderBox", function(Asset, Blender, EngineDriver, User)
{
  return {
    restrict: "E",
    templateUrl: "/tde/blender-box/blender-box.html",
    scope: {
      visible: "="
    },
    link: function($scope, element, attrs)
    {
      $scope.blender = Blender
      var prefs = $scope.prefs = User.prefs
      var uniformOverrides = prefs.blenderUniforms

      var refreshTimeoutId;
      function refreshOverrides() {
        if (refreshTimeoutId)
          clearTimeout(refreshTimeoutId);
        refreshTimeoutId = setTimeout(function() {
          refreshTimeoutId = null;
          
          var context = Blender.context;
          var data = Blender.data;
          var scenes = Blender.scenes;
          var value;
          
          uniformOverrides.forEach(function(uniform) {
            if (uniform.editingName) {
              $scope.hints = Object.keys(uniforms).filter(function(name) {
                return name.indexOf(uniform.name) !== -1;
              });
              return;
            }

            if (!uniform.name)
              return;
            
            if (uniform.editingPath) {
              value = {
                context: context,
                data: data,
                scenes: scenes
              };
              if (uniform.expression) {
                var expression = uniform.expression.split(".");
                for (var i = 0, n = expression.length; i < n; ++i) {
                  var fragment = expression[i];
                  if (!value.hasOwnProperty(fragment)) {
                    $scope.hints = Object.keys(value).filter(function(name) {
                      return name.indexOf(fragment) === 0;
                    });
                    break;
                  }
                  value = value[fragment];
                }
              } else
                $scope.hints = Object.keys(value);
            }
            
            try {
              value = eval(uniform.expression);
              uniform.valid = (typeof value !== "undefined");
            } catch(err) {
              uniform.valid = false;
            }
            
            if (prefs.blenderOverride && uniform.valid)
              EngineDriver.overrideUniform(uniform.name, value);
            else
              EngineDriver.removeUniformOverride(uniform.name);
          });
        }, 10);
      }
      
      Blender.addListener("close", refreshOverrides);
      Blender.addListener("context", refreshOverrides);
      Blender.addListener("data", refreshOverrides);
      Blender.addListener("open", refreshOverrides);
      Blender.addListener("scene", refreshOverrides);
      
      $scope.$watch("prefs", function()
      {
        for (var i = 0; i < uniformOverrides.length - 1; ++i) {
          var uniform = uniformOverrides[i];
          if (!uniform.name && !uniform.expression) {
            uniformOverrides.splice(i, 1);
            --i;
          }
        }
        
        if (!uniformOverrides.length || uniformOverrides[uniformOverrides.length - 1].name || uniformOverrides[uniformOverrides.length - 1].expression)
          uniformOverrides.push({
            name: "",
            expression: ""
          });
          
        refreshOverrides();
        User.saveData();
      }, true)

      $scope.$on("currentTime", function(event, currentTime) {
        if (!prefs.blenderPlay)
          return;
        
        Blender.setTime(prefs.blenderPlayScene, currentTime);
      });
      
      $scope.editUniformName = function(uniform) {
        uniform.editingName = true;
        if (uniform.name)
          EngineDriver.removeUniformOverride(uniform.name);
      }
      
      $scope.editUniformPath = function(uniform) {
        uniform.editingPath = true;
        refreshOverrides();
      }
      
      $scope.blurUniform = function(uniform) {
        delete uniform.editingName;
        delete uniform.editingPath;
        $scope.hints = null;
        refreshOverrides();
      }
      
      $scope.removeUniform = function(i) {
        uniformOverrides.splice(i, 1)[0];
        refreshOverrides();
      }
      
      $scope.autoComplete = function(event, uniform, prop) {
        if (event.ctrlKey && event.which === 32) {
          event.preventDefault();
          if ($scope.hints && $scope.hints.length === 1) {
            var index = uniform[prop].lastIndexOf(".") + 1;
            uniform[prop] = uniform[prop].substr(0, index) + $scope.hints[0];
          }
        }
      }
    }
  }
})
