'use strict';

// main dashboard page controller
perfDashboardControllers.controller('DashboardCtrl', ['$scope', '$rootScope', 'dashboardApi', 
    function($scope, $rootScope, dashboardApi) {
    	$scope.response = {'ios': {}, 'android': {}};
		$scope.previous = {'ios': {}, 'android': {}};
		$scope.temp = {'ios': {}, 'android': {}};
        bkPerf.clearCharts($rootScope);
        // async false if the controller is called on route changing, true if it is called after, for example on a change of settings by the user
		$scope.getDashboard = function (async) {
			(dashboardApi['dashboard'])($rootScope, $scope, async);
		};
		$scope.getDashboard(false);
    }
]);