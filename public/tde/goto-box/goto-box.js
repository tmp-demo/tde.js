angular.module("tde.goto-box", [])

.directive("tdeGotoBox", function(Asset)
{
  return {
    restrict: "E",
    templateUrl: "/tde/goto-box/goto-box.html",
    link: function($scope, element, attrs)
    {
    	$scope.listData = []
    	$scope.selectedIndex = null
    	$scope.visible = false

		var scrollables = element.find(".scrollable")
		scrollables.mCustomScrollbar()

		function updateScroll()
		{
			setTimeout(function()
			{
			  scrollables.mCustomScrollbar("update")
			}, 0)
		}

		$scope.$watch("filterText", function()
		{
			$scope.selectedIndex = 0
			updateScroll()
		})

		$scope.selectItem = function(item) {
			$scope.visible = false;

			$scope.$emit("gotoBoxItemSelected", item);
		}
		
		$scope.highlight = function(item) {
			if ($scope.filterText)
				return item.replace(new RegExp($scope.filterText, 'g'), '<span class="green">' + $scope.filterText + '</span>');
			return item;
		}
		
		$scope.getTypeIconClass = Asset.getTypeIconClass
		
		element.find("input").keydown(function(event)
		{
			$scope.$apply(function()
			{
				if (event.keyCode == 40 /* Down */) $scope.selectedIndex++;
				if (event.keyCode == 38 /* Up */)   $scope.selectedIndex--;

				var filteredList = element.find("li")
				if ($scope.selectedIndex < 0) $scope.selectedIndex = 0;
				if ($scope.selectedIndex >= filteredList.length) $scope.selectedIndex = filteredList.length - 1;

				if (event.keyCode == 13 /* Enter */) {
					$scope.selectItem(filteredList[$scope.selectedIndex].getAttribute("data-item"));
				}
			})
		})

		$(window).keydown(function(event)
		{
			$scope.$apply(function()
			{
				if (event.ctrlKey && event.keyCode == 80 /* p */) {
					event.preventDefault();

					$scope.visible = !$scope.visible;
					if ($scope.visible) {
						$scope.filterText = "";
						$scope.selectedIndex = 0;
						$scope.listData = Object.keys(Asset.assets)

						setTimeout(function() {
							element.find("input").focus();
						}, 0)
					}
				}

				if (event.keyCode == 27 /* Esc */) {
					event.preventDefault();

					$scope.visible = false;
				}
			})
		})
    }
  }
})
