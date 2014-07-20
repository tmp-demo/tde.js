angular.module("tde.project.texture-editor", [])

.controller("TextureEditorCtrl", function($scope, Asset)
{
  $scope.code = "texture code \\o/"
  $scope.error = "some error line 42"
  
  $scope.updateAsset = function(callback)
  {
    Asset.updateAsset($scope.assetId, $scope.code, function(err)
    {
      if (callback)
        callback(err)
    })
  }
})

.directive("tdeCodeEditor", function()
{
  return {
    restrict: "A",
    link: function($scope, element, attrs, Asset)
    {
      $scope.error = null
      $scope.dirty = false
      
      var editor = CodeMirror(element.get(0), {
        mode: attrs.tdeCodeEditor,
        matchBrackets: true,
        lineNumbers: true,
        theme: "monokai",
        value: $scope.code
      })
      
      editor.on("change", function()
      {
        $scope.$apply(function()
        {
          $scope.dirty = true
        })
      })
      
      element.keypress(function(event)
      {
        if (event.ctrlKey && (event.keyCode == 13 || event.keyCode == 10))
        {
          $scope.$apply(function()
          {
            $scope.code = editor.getValue()
            try
            {
              eval($scope.code)
              
              $scope.updateAsset(function(err)
              {
                if (err)
                {
                  $scope.error = err.error.message
                }
                else
                {
                  $scope.error = null
                  $scope.dirty = false
                }
              })
            }
            catch (err)
            {
              $scope.error = err.message
            }
          })
        }
      })
    }
  }
})
