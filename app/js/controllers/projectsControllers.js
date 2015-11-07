'use strict';

// dashboard detailed pages controller
perfDashboardControllers.controller('projectsCtrl', ['$scope', '$rootScope', 'projectsApi', 
    function ($scope, $rootScope, projectsApi) {
    	$scope.response = {'ios': {}, 'android': {}};
		$scope.previous = {'ios': {}, 'android': {}};
		$scope.temp = {'ios': {}, 'android': {}};
		bkPerf.clearCharts($rootScope);
        // async false if the controller is called on route changing, true if it is called after, for example on a change of settings by the user
		$scope.getApiData = function (async) {
			(projectsApi[$rootScope.navigationPart])($rootScope, $scope, async);
		};
		$scope.getApiData(false);
    }
]);
