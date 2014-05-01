var directives = angular.module("tde.directives", [])

directives.directive("tdeNavbar", function()
{
	return {
		restrict: "E",
		templateUrl: "partials/navbar.html"
	}
})

directives.directive("tdeAssetList", function()
{
	return {
		restrict: "E",
		templateUrl: "partials/asset-list.html",
		link: function($scope, element, attrs)
		{
			var scrollables = element.find(".scrollable")
			scrollables.mCustomScrollbar()
			
			function updateScroll()
			{
				setTimeout(function()
				{
					scrollables.mCustomScrollbar("update")
				}, 0)
			}
			$scope.$watch("assets", updateScroll, true)
			$scope.$watch("query", updateScroll)
			
			$scope.$watch("editedAsset", function(newValue, oldValue)
			{
				setTimeout(function()
				{
					element.find(".rename-box").focus().select()
				}, 0)
			})
			
			$scope.checkEscape = function(event)
			{
				if (event.keyCode == 27) // Esc
					$scope.cancelRename()
			}
		}
	}
})

ctx = null
directives.directive("tdeCodeEditor", function()
{
	return {
		restrict: "A",
		link: function($scope, element, attrs)
		{
			$scope.assetData = "ctx.fillStyle = \"rgb(40, 40, 20)\"\nctx.fillRect(100, 50, 100, 60)\n\nctx.fillStyle = \"rgb(200, 200, 140)\"\nfor (var i = 0; i < 100; i++)\n  ctx.fillRect(Math.sin(i) * 5 + 45, i*5, 20, 2)\n\nctx.fillStyle = \"rgb(20, 30, 50)\"\nctx.fillRect(100, 150, 100, 60)\n\nctx.fillStyle = \"rgb(100, 140, 255)\"\nfor (var i = 0; i < 100; i++)\n  ctx.fillRect(Math.sin(i) * 5 + 20, i*5, 20, 2)"
			
			var editor = CodeMirror(element.get(0), {
				mode: attrs.tdeCodeEditor,
				/*matchBrackets: true,
				autoCloseBrackets: true,*/
				lineNumbers: true,
				theme: "monokai",
				value: $scope.assetData
			})
			
			editor.on("change", function()
			{
				$scope.$apply(function()
				{
					$scope.assetData = editor.getValue()
					$scope.render()
				})
			})
			
			ctx = ctx || $(".texture-editor canvas").get(0).getContext("2d")
			$scope.render = function()
			{
				ctx.fillStyle = "rgb(0, 0, 0)"
				ctx.fillRect(0, 0, 256, 256)
				
				try
				{
					eval($scope.assetData)
					$scope.error = ""
				}
				catch (err)
				{
					$scope.error = err.message
				}
			}
			$scope.render()
			
			/*$scope.$watch("assetData", function(newValue, oldValue)
			{
				editor.setValue(newValue)
			})*/
		}
	}
})
