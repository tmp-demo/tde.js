angular.module("tde.code-editor", [])

.controller("CodeEditorCtrl", function($scope, Asset)
{
  $scope.code = ($scope.assetId in Asset.assets) ? Asset.assets[$scope.assetId] : "loading..."
  $scope.$on("assetLoaded", function(event, assetId)
  {
    $scope.code = Asset.assets[$scope.assetId]
  })
  
  $scope.error = null
  $scope.dirty = false
  
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
    restrict: "E",
    controller: "CodeEditorCtrl",
    templateUrl: "/tde/code-editor/code-editor.html",
    link: function($scope, element, attrs)
    {
      $scope.error = null
      $scope.dirty = false
      
      var editor = CodeMirror(element.find(".codemirror-wrapper").get(0), {
        mode: attrs.language,
        matchBrackets: true,
        lineNumbers: true,
        theme: "monokai",
        value: $scope.code
      })
      
      var updatingCodeFromEditor = false
      $scope.$watch("code", function(code)
      {
        if (updatingCodeFromEditor)
          return
        
        editor.setValue(code)
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
          updatingCodeFromEditor = true
          $scope.$apply(function()
          {
            var code = editor.getValue()
            
            // ignore if not modified
            if (code == $scope.code)
              return
            
            $scope.code = code
            try
            {
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
          updatingCodeFromEditor = false
        }
      })
    }
  }
})
