'use strict';

var perfDashboardControllers = angular.module('perfDashboardControllers', []);

perfDashboardControllers.displayError = function($rootScope, $scope, api, refresh) {
    if (api == '')
        $rootScope.loading = 'error';
    else if (api == 'google')
        $rootScope.loadingGoogle = 'error';
    else if (api == 'appfigures')
        $rootScope.loadingAppfigures = 'error';
    else if (api == 'urbanairship')
        $rootScope.loadingUrbanairship = 'error';
    if (refresh)
        $scope.$apply();
}
