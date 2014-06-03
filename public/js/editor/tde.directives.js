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

directives.directive("tdeCodeEditor", function()
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

directives.directive("tdeEngineView", function()
{
	return {
		restrict: "E",
		templateUrl: "partials/engine-view.html",
		link: function($scope, element, attrs)
		{
			editor_main()
			
			var seeker = element.find(".seeker")
			seeker.on("input", function()
			{
				demo.start_time = audioContext.currentTime * 1000 - this.value
			})
			
			setInterval(function()
			{
				seeker.val(audioContext.currentTime * 1000 - demo.start_time)
			}, 50)
			
			// compute start tinme for each scene
			var time_sum = 0
			for (var s=0;s<demo.scenes.length;++s)
			{
				demo.scenes[s].start_time = time_sum
				time_sum += demo.scenes[s].duration
			}
			demo.end_time = time_sum
			seeker.attr("max", time_sum)
			
			element.find("canvas").dblclick(function()
			{
				this.requestFullScreen = this.requestFullScreen || this.mozRequestFullScreen || this.webkitRequestFullScreen
				this.requestFullScreen()
			})
		}
	}
})
