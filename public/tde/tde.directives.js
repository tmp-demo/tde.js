angular.module("tde.directives", [])

.directive("tdeCodeEditor", function()
{
	return {
		restrict: "A",
		link: function($scope, element, attrs)
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
							$scope.error = null
							$scope.dirty = false
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
