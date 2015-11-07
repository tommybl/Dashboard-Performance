'use strict';

var perfDashboardApp = angular.module('perfDashboardApp', ['ngRoute', 'perfDashboardConfig', 'perfDashboardControllers', 'perfDashboardServices']);

perfDashboardApp.config(['$routeProvider',
    function($routeProvider) {
        // angularjs routing
        $routeProvider.
        when('/login', {
            templateUrl: 'login?login=' + accountLoginStatus,
            controller: '',
            navigationPart: 'login'
        }).
        when('/configuration', {
            templateUrl: 'partials/configuration',
            controller: '',
            navigationPart: 'configuration'
        }).
        when('/dashboard', {
            templateUrl: 'partials/dashboard',
            controller: '',
            navigationPart: 'dashboard'
        }).
        when('/unique-visitors', {
            templateUrl: 'partials/unique-visitors',
            controller: 'projectsCtrl',
            navigationPart: 'unique-visitors'
        }).
        when('/page-views', {
            templateUrl: 'partials/page-views',
            controller: 'projectsCtrl',
            navigationPart: 'page-views'
        }).
        when('/downloads', {
            templateUrl: 'partials/downloads',
            controller: 'projectsCtrl',
            navigationPart: 'downloads'
        }).
        when('/updates', {
            templateUrl: 'partials/updates',
            controller: 'projectsCtrl',
            navigationPart: 'updates'
        }).
        when('/ranks', {
            templateUrl: 'partials/ranks',
            controller: 'projectsCtrl',
            navigationPart: 'ranks'
        }).
        when('/ratings', {
            templateUrl: 'partials/ratings',
            controller: 'projectsCtrl',
            navigationPart: 'ratings'
        }).
        when('/sends', {
            templateUrl: 'partials/sends',
            controller: 'projectsCtrl',
            navigationPart: 'sends'
        }).
        when('/opens', {
            templateUrl: 'partials/opens',
            controller: 'projectsCtrl',
            navigationPart: 'opens'
        }).
         when('/pushes', {
            templateUrl: 'partials/pushes',
            controller: 'projectsCtrl',
            navigationPart: 'pushes'
        }).
        when('/timeinapp', {
            templateUrl: 'partials/timeinapp',
            controller: 'projectsCtrl',
            navigationPart: 'timeinapp'
        }).
        when('/add-account', {
            templateUrl: 'partials/add-account',
            controller: '',
            navigationPart: 'add-account'
        }).
        when('/add-user', {
            templateUrl: 'partials/add-user',
            controller: '',
            navigationPart: 'add-user'
        }).
        when('/get-accounts-users', {
            templateUrl: 'partials/get-accounts-users',
            controller: '',
            navigationPart: 'get-accounts-users'
        }).
        otherwise({
            redirectTo: '/dashboard'
        });
    }
]);

perfDashboardApp.run(function ($rootScope, $location, $route, $templateCache, CHARTS_OPTIONS) {

    // allow user to change route directly in browser url bar without refreshing the page
    var original = $location.path;
    $location.path = function (path, reload) {
        if (reload === false) {
            var lastRoute = $route.current;
            var un = $rootScope.$on('$locationChangeSuccess', function () {
                $route.current = lastRoute;
                un();
            });
        }
        return original.apply($location, [path]);
    };

    $rootScope.appfigures = {ios: {}, android: {}};
    $rootScope.google = {ios: {}, android: {}};
	$rootScope.googleCharts = {};
    $rootScope.loading = '';

    if (accountLoginUser != undefined && accountUserType != 'admin') {

        // getting android and ios products informations of google analytics and app figures configuration
        bkPerf.getAccounts($rootScope);

        // getting user last settings from cookies if they are set
        if (bkPerf.getCookie('perfPeriod') != '') $rootScope.perfPeriod = bkPerf.getCookie('perfPeriod');
        else $rootScope.perfPeriod = 'month';
        if (bkPerf.getCookie('perfSettings') != '') $rootScope.perfSettings = bkPerf.getCookie('perfSettings');
        else $rootScope.perfSettings = 'daily';

        // using momentjs to format start and end dates that will be used to request APIs
        $rootScope.startDate = moment().subtract(1, $rootScope.perfPeriod).format('YYYY-MM-DD');
        $rootScope.endDate = moment().format('YYYY-MM-DD');
        // setting charts and tables date format
        if ($rootScope.perfSettings == 'hourly') $rootScope.perfDateFormat = {chart: 'YYYY-MM-DDTHH:MM:SS', table: 'YYYY-MM-DD HH:MM:SS'};
        else $rootScope.perfDateFormat = {chart: 'YYYY-MM-DDTHH:MM:SS', table: 'YYYY-MM-DD'};
        // setting calendar start and end dates
        $('#datepickerStart').data("DateTimePicker").setDate(moment($rootScope.startDate, 'YYYY-MM-DD').format('DD/MM/YYYY'));
        $('#datepickerEnd').data("DateTimePicker").setDate(moment($rootScope.endDate, 'YYYY-MM-DD').format('DD/MM/YYYY'));
    }
    
    // when user changes route, before next page rendering
    $rootScope.$on("$routeChangeStart", function(event, next, current) {

        // stopping all pending ajax requests from previous page
        bkPerf.stopRequests();

        // redirections according to user type and if user is logged or not
        if (next.navigationPart == "login" && accountLoginUser != undefined) {
            if (accountUserType == "admin") $location.path( "/add-account");
            else $location.path( "/dashboard");
        }
        else if (next.navigationPart != "login" && accountLoginUser == undefined) {
            $location.path( "/login" );
        }
        else if (next.navigationPart == "dashboard" && accountLoginUser != undefined && accountUserType == "admin") {
            $location.path( "/get-accounts-users");
        }

        // remove all partial views from angularjs cache, to render modifications according to user infos updates
        $templateCache.removeAll();
    });

    // after the route was successfully changed
    $rootScope.$on('$routeChangeSuccess', function(ev,data) {
        $rootScope.controller = '';
        $rootScope.loading = 'process';
        // settings buttons are disabled during 2 seconds to wait for current requests to be completed before user can ask other settings
        bkPerf.disableButtons();
        if (data.$$route) {
            $rootScope.navigationPart = data.$$route.navigationPart;
        }
    });
    
    // on refresh button click
    $(".btn-refresh").click(function (e) {
        // settings buttons are disabled during 2 seconds to prevent user from clicking on settings lots of times, that would make dashboard performances drop
        bkPerf.disableButtons();
        // stopping all pending ajax requests from other settings click
        bkPerf.stopRequests();

        // refreshing the last period of datas to retrieve to be sure to have the current day
        if ($rootScope.perfPeriod != "calendar") {
            $rootScope.startDate = moment().subtract(1, $rootScope.perfPeriod).format('YYYY-MM-DD');
            $rootScope.endDate = moment().format('YYYY-MM-DD');
        }

        $rootScope.loading = 'process';
        $rootScope.$apply();
        // calling the current controller to refresh datas
        bkPerf.refreshDatas($rootScope, 'all');
    });

    // on granularity button click
    $(".menu-settings button").click(function (e) {
        // settings buttons are disabled during 2 seconds to prevent user from clicking on settings lots of times, that would make dashboard performances drop
        bkPerf.disableButtons();
        // stopping all pending ajax requests from other settings click
        bkPerf.stopRequests();

        // setting the new granularity chosen
        $rootScope.perfSettings = e.target.getAttribute("data-option");
        bkPerf.setCookie('perfSettings', $rootScope.perfSettings, 365);
        if ($rootScope.perfSettings == 'hourly') $rootScope.perfDateFormat.table = 'YYYY-MM-DD HH:MM:SS';
        else $rootScope.perfDateFormat.table = 'YYYY-MM-DD';

        $rootScope.loading = 'process';
        $rootScope.$apply();
        // refreshing datas with the new granularity
        bkPerf.refreshDatas($rootScope, 'all');
    });
    
    // on period button click
    $(".menu-period button").click(function (e) {
        // settings buttons are disabled during 2 seconds to prevent user from clicking on settings lots of times, that would make dashboard performances drop
        bkPerf.disableButtons();
        // stopping all pending ajax requests from other settings click
        bkPerf.stopRequests();

        // setting the new period chosen
        $rootScope.perfPeriod = e.target.getAttribute("data-option");
        bkPerf.setCookie('perfPeriod', $rootScope.perfPeriod, 365);
        $rootScope.startDate = moment().subtract(1, $rootScope.perfPeriod).format('YYYY-MM-DD');
        $rootScope.endDate = moment().format('YYYY-MM-DD');

        $rootScope.loading = 'process';
        $rootScope.$apply();
        // refreshing datas with the new period
        bkPerf.refreshDatas($rootScope, 'all');
        // setting the calendar with the new period
        $('#datepickerStart').data("DateTimePicker").setDate(moment($rootScope.startDate, 'YYYY-MM-DD').format('DD/MM/YYYY'));
        $('#datepickerEnd').data("DateTimePicker").setDate(moment($rootScope.endDate, 'YYYY-MM-DD').format('DD/MM/YYYY'));
    });

    // on calendar button click
    $("#validateCalendar button").click(function (e) {
        // getting start and end date from calendar
        var start = $("#datepickerStart").val(), end = $("#datepickerEnd").val();
        var dates = [];
        // function to diplay an error
        var displayErr = function (mess) {
            $("#calendarError").text(mess);
            $("#calendarErrorContainer").show();
        };
        // function to verify validity of the chosen dates
        var testDate = function (date) {
            var matches = /^([0-9]{2})[∕\/]([0-9]{2})[∕\/]([0-9]{4})$/.exec(date);
            if (matches == null) return false;
            var d = parseInt(matches[1]);
            var m = parseInt(matches[2]) - 1;
            var y = parseInt(matches[3]);
            var composedDate = new Date(y, m, d);
            dates.push(composedDate);
            return composedDate.getDate() == d && composedDate.getMonth() == m && composedDate.getFullYear() == y;
        };
        // verifying validity of the chosen dates and period
        if (!testDate(start) || !testDate(end)) return displayErr('Format de date invalide.');
        if (dates[1] <= dates[0]) return displayErr('Les dates ne peuvent pas être identiques. La date de fin ne peut être inférieure à la date de début.');
        var a = moment(start, 'DD/MM/YYYY');
        var b = moment(end, 'DD/MM∕YYYY');
        var diff = b.diff(a, 'days');
        if (diff > 731) return displayErr('La période ne peut être supérieure à 2 ans.');

        // settings buttons are disabled during 2 seconds to prevent user from clicking on settings lots of times, that would make dashboard performances drop
        bkPerf.disableButtons();
        // stopping all pending ajax requests from other settings click
        bkPerf.stopRequests();
        
        // setting new chosen period
        $rootScope.perfPeriod = "calendar";
        $rootScope.startDate = a.format('YYYY-MM-DD');
        $rootScope.endDate = b.format('YYYY-MM-DD');
        bkPerf.setCookie('perfPeriod', '', 365);
        $rootScope.loading = 'process';
        $rootScope.$apply();
        // refreshing datas with the new dates
        bkPerf.refreshDatas($rootScope, 'all');
    });
    
    // resizing google charts when the page is resized
    $(window).resize(function(){
    	Object.keys($rootScope.googleCharts).forEach(function(key) {
    	    var chart = $rootScope.googleCharts[key];
            var options = CHARTS_OPTIONS[chart.type];
            if (chart.series != undefined)
                options['series'] = chart.series;
    	    chart.elt.draw(chart.data, options);
    	});
    });
});

// custom angularjs filter to render the dates
perfDashboardApp.filter('dateFormat', function () {
    return function (input, format) {
        return moment(input, format).format('DD/MM/YYYY');
    };
});

// custum angularjs filter to render the granularities
perfDashboardApp.filter('granularityFormat', function () {
    return function (input) {
        if (input == 'hourly') return 'heures';
        if (input == 'daily') return 'jours';
        if (input == 'weekly') return 'semaines';
        if (input == 'monthly') return 'mois';
        if (input == 'yearly') return 'années';
        return '--';
    };
});