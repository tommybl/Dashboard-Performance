'use strict';

var perfDashboardServices = angular.module('perfDashboardServices', []);

// requests table and cancelers table to be able to stop all pending requests when we need to
perfDashboardServices.allRequests = [];
perfDashboardServices.allCancelers = [];
perfDashboardServices.allStopers = [];

// main dashboard page service
perfDashboardServices.factory('dashboardApi', ['$q', '$http', 'DATA_TABLE_DEFAULT_OPTIONS', 'CHARTS_OPTIONS', 'COUNT_OPTIONS', function ($q, $http, DATA_TABLE_DEFAULT_OPTIONS, CHARTS_OPTIONS, COUNT_OPTIONS) {
    var instance = {
        'dashboard': function ($rootScope, $scope, async) {
            // app figures indicators queries
            perfDashboardServices.getDataInt($rootScope, $scope, "downloads", COUNT_OPTIONS);
            perfDashboardServices.getDataToPieChartCompare($rootScope, $scope, "downloads", ["OS", "Téléchargements"], "chart6", CHARTS_OPTIONS, true);
            perfDashboardServices.getDataRating($rootScope, $scope, "ratings", COUNT_OPTIONS);
            perfDashboardServices.getDataRank($rootScope, $scope, "ranks", COUNT_OPTIONS);
            perfDashboardServices.getDataInt($rootScope, $scope, "updates", COUNT_OPTIONS);
            perfDashboardServices.getDataToPieChartCompare($rootScope, $scope, "updates", ["OS", "Mises à jour"], "chart8", CHARTS_OPTIONS, true);
            perfDashboardServices.getDataInt($rootScope, $scope, "revenue", COUNT_OPTIONS);
            perfDashboardServices.getDataToAreaChart($rootScope, $scope, "revenue", ["Date", "iOS", "Android"], "chart10", CHARTS_OPTIONS, true);
            // urban airship indicators queries
            perfDashboardServices.getDataInt($rootScope, $scope, "sends", COUNT_OPTIONS);
            perfDashboardServices.getDataToAreaChart($rootScope, $scope, "sends", ["Date", "iOS", "Android"], "chart11", CHARTS_OPTIONS, true);
            perfDashboardServices.getDataInt($rootScope, $scope, "opens", COUNT_OPTIONS);
            perfDashboardServices.getDataToAreaChart($rootScope, $scope, "opens", ["Date", "iOS", "Android"], "chart12", CHARTS_OPTIONS, true);
            perfDashboardServices.getPushListingSpark($rootScope, $scope, "listing", "chart14", [' ', 'Date', 'Type', 'Sent']);
            perfDashboardServices.getDataInt($rootScope, $scope, "timeinapp", COUNT_OPTIONS);
            perfDashboardServices.getDataToAreaChart($rootScope, $scope, "timeinapp", ["Date", "iOS", "Android"], "chart13", CHARTS_OPTIONS, true);
            // google analytics indicators queries
            perfDashboardServices.getDataInt($rootScope, $scope, "uniqueVisitors", COUNT_OPTIONS);
            perfDashboardServices.getDataToAreaChart($rootScope, $scope, "uniqueVisitors", ["Date", "iOS", "Android"], "chart1", CHARTS_OPTIONS, true);
            perfDashboardServices.getDataInt($rootScope, $scope, "pageViews", COUNT_OPTIONS);
            perfDashboardServices.getDataToAreaChart($rootScope, $scope, "pageViews", ["Date", "iOS", "Android"], "chart2", CHARTS_OPTIONS, true);
            perfDashboardServices.getDataInt($rootScope, $scope, "avgSessionDuration", COUNT_OPTIONS);
            perfDashboardServices.getDataToAreaChart($rootScope, $scope, "avgSessionDuration", ["Date", "iOS", "Android"], "chart3", CHARTS_OPTIONS, true);
            perfDashboardServices.getDataInt($rootScope, $scope, "bounceRate", COUNT_OPTIONS);
            perfDashboardServices.getDataToAreaChart($rootScope, $scope, "bounceRate", ["Date", "iOS", "Android"], "chart4", CHARTS_OPTIONS, true);
            perfDashboardServices.getDataString($rootScope, $scope, "operatingSystemSessions");
            // scope.apply only if scope is not already rendering or in digestion
            if (async) $scope.$apply();
        }
    }
    return instance;
}]);

// dashboard detailed pages service
perfDashboardServices.factory('projectsApi', ['$q', '$http', 'DATA_TABLE_DEFAULT_OPTIONS', 'CHARTS_OPTIONS', 'COUNT_OPTIONS', function ($q, $http, DATA_TABLE_DEFAULT_OPTIONS, CHARTS_OPTIONS, COUNT_OPTIONS){
    var instance = {
        'unique-visitors': function($rootScope, $scope, async) {
            perfDashboardServices.getDataInt($rootScope, $scope, "uniqueVisitors", COUNT_OPTIONS);
            perfDashboardServices.getDataToAreaChart($rootScope, $scope, "uniqueVisitors", ["Date", "iOS", "Android"], "chart1", CHARTS_OPTIONS, false);
            perfDashboardServices.getDataToGeoChart($rootScope, $scope, "uniqueVisitorsCountry", ["Country", "Visiteurs"], ["chart2", "chart3"], CHARTS_OPTIONS);
            // scope.apply only if scope is not already rendering or in digestion
            if (async) $scope.$apply();
        },
        'page-views': function($rootScope, $scope, async) {
            perfDashboardServices.getDataInt($rootScope, $scope, "pageViews", COUNT_OPTIONS);
            perfDashboardServices.getDataToGaugeChart($rootScope, $scope, "avgTimePage", ["iOS", "Android"], "chart1", CHARTS_OPTIONS);
            perfDashboardServices.getDataToAreaChart($rootScope, $scope, "pageViews", ["Date", "iOS", "Android"], "chart2", CHARTS_OPTIONS, false);
            perfDashboardServices.getDataToTable($rootScope, $scope, "pageViewsPath", ["chart3", "chart4"], DATA_TABLE_DEFAULT_OPTIONS);
            if (async) $scope.$apply();
        },
        'downloads': function($rootScope, $scope, async) {
            perfDashboardServices.getDataInt($rootScope, $scope, "downloads", COUNT_OPTIONS);
            perfDashboardServices.getDataToAreaChart($rootScope, $scope, "downloads", ["Date", "iOS", "Android"], "chart1", CHARTS_OPTIONS, false);
            perfDashboardServices.getDataToPieChartCompare($rootScope, $scope, "downloads", ["OS", "Téléchargements"], "chart2", CHARTS_OPTIONS, false);
            if (async) $scope.$apply();
        },
        'updates': function($rootScope, $scope, async) {
            perfDashboardServices.getDataInt($rootScope, $scope, "updates", COUNT_OPTIONS);
            perfDashboardServices.getDataToAreaChart($rootScope, $scope, "updates", ["Date", "iOS", "Android"], "chart1", CHARTS_OPTIONS, false);
            perfDashboardServices.getDataToPieChartCompare($rootScope, $scope, "updates", ["OS", "Mises à jour"], "chart2", CHARTS_OPTIONS, false);
            if (async) $scope.$apply();
        },
        'ranks': function($rootScope, $scope, async) {
            perfDashboardServices.getDataRank($rootScope, $scope, "ranks", COUNT_OPTIONS);
            perfDashboardServices.getDataRankToArea($rootScope, $scope, "ranks", ["Date", "iOS", "Android"], ["chart1", "chart2"], CHARTS_OPTIONS, false);
            if (async) $scope.$apply();
        },
        'ratings': function($rootScope, $scope, async) {
            perfDashboardServices.getDataRating($rootScope, $scope, "ratings", COUNT_OPTIONS);
            perfDashboardServices.getReviewsListing($rootScope, $scope, "reviews", "chart1");
            if (async) $scope.$apply();
        },
        'sends': function($rootScope, $scope, async) {
            perfDashboardServices.getDataInt($rootScope, $scope, "sends", COUNT_OPTIONS);
            perfDashboardServices.getDataInt($rootScope, $scope, "direct", COUNT_OPTIONS);
            perfDashboardServices.getDataInt($rootScope, $scope, "influenced", COUNT_OPTIONS);
            perfDashboardServices.getDataToComboChart($rootScope, $scope, ['sends', 'direct', 'influenced'], ["Envoyées", "Directes", "Influencées"], ['bars', 'line', 'line'], "chart1", CHARTS_OPTIONS, false, $q, $http);
            if (async) $scope.$apply();
        },
        'opens': function($rootScope, $scope, async) {
            perfDashboardServices.getDataInt($rootScope, $scope, "opens", COUNT_OPTIONS);
            perfDashboardServices.getDataInt($rootScope, $scope, "optins", COUNT_OPTIONS);
            perfDashboardServices.getDataInt($rootScope, $scope, "optouts", COUNT_OPTIONS);
            perfDashboardServices.getDataToComboChart($rootScope, $scope, ['opens', 'optins', 'optouts'], ["Ouvertes", "Optins", "Optouts"], ['bars', 'line', 'line'], "chart1", CHARTS_OPTIONS, false, $q, $http);
            if (async) $scope.$apply();
        },
        'pushes': function($rootScope, $scope, async) {
            perfDashboardServices.getPushListing($rootScope, $scope, "listing", "chart1", DATA_TABLE_DEFAULT_OPTIONS);
            if (async) $scope.$apply();
        },
        'timeinapp': function($rootScope, $scope, async) {
            perfDashboardServices.getDataInt($rootScope, $scope, "timeinapp", COUNT_OPTIONS);
            perfDashboardServices.getDataToAreaChart($rootScope, $scope, "timeinapp", ["Date", "iOS", "Android"], "chart1", CHARTS_OPTIONS, false);
            if (async) $scope.$apply();
        }
    }
    return instance;
}]);

// setting and displaying error on numbers on panels
perfDashboardServices.getDataIntFuncErr = function ($scope, codeName, results, os) {
    var dataPrev = $scope.temp[os][codeName];
    $scope.previous[os][codeName] = (dataPrev == undefined || dataPrev == 'ERROR') ? 0 : dataPrev;
    $scope.response[os][codeName+"Past"] = 'ERROR';
    $scope.response[os][codeName] = 'ERROR';
    $scope.response[os][codeName+"Trend"] = "equal";
    $scope.response[os][codeName+"Compare"] = "";
    $scope.temp[os][codeName] = $scope.response[os][codeName];
    if (os == 'ios') $('#'+codeName+'Ios').html($scope.response[os][codeName]);
    else $('#'+codeName+'Android').html($scope.response[os][codeName]);
    $scope.response[os][codeName+"Loading"] = 'error';
};

// function to render indicator data to numbers (comparaison between current period and last period)
perfDashboardServices.getDataIntFunc = function ($scope, codeName, results, os) {
    // saving previous result to use it during the js count up-down (counting from the previous result to the new one)
    var dataPrev = $scope.temp[os][codeName];
    $scope.previous[os][codeName] = (dataPrev == undefined || dataPrev == 'ERROR') ? 0 : dataPrev;
    // setting new result (current and past period to compare)
    $scope.response[os][codeName+"Past"] = 0;
    $scope.response[os][codeName] = 0;
    if (results[os].datas != undefined) {
        $scope.response[os][codeName+"Past"] = Math.round(parseFloat(results[os].datas[0][1]) * 100) / 100;
        $scope.response[os][codeName] = Math.round(parseFloat(results[os].datas[1][1]) * 100) / 100;
    }
    // setting the trend (up, equal, down) to set the panel color (green, blue, red) and the arrow direction, and the comparaison with the past period
    if ($scope.response[os][codeName+"Past"] == $scope.response[os][codeName]) {
        $scope.response[os][codeName+"Trend"] = "equal";
        $scope.response[os][codeName+"Compare"] = "0%"
    }
    else if ($scope.response[os][codeName+"Past"] < $scope.response[os][codeName]) {
        $scope.response[os][codeName+"Trend"] = "up";
        if ($scope.response[os][codeName+"Past"] == 0)
            $scope.response[os][codeName+"Compare"] = "100%"
        else
            $scope.response[os][codeName+"Compare"] = (Math.round(((($scope.response[os][codeName]-$scope.response[os][codeName+"Past"])/$scope.response[os][codeName+"Past"])*100) * 100) / 100) + '%';
    }
    else if ($scope.response[os][codeName+"Past"] > $scope.response[os][codeName]) {
        $scope.response[os][codeName+"Trend"] = "down";
        if ($scope.response[os][codeName] == 0)
            $scope.response[os][codeName+"Compare"] = "100%"
        else
            $scope.response[os][codeName+"Compare"] = (Math.round(((($scope.response[os][codeName+"Past"]-$scope.response[os][codeName])/$scope.response[os][codeName+"Past"])*100) * 100) / 100) + '%';
    }
    $scope.temp[os][codeName] = $scope.response[os][codeName];
    $scope.response[os][codeName+"Loading"] = 'success';
};

// function to get and render indicator data to numbers (comparaison between current period and last period, between ios and android)
perfDashboardServices.getDataInt = function ($rootScope, $scope, codeName, COUNT_OPTIONS) {
    // setting ios and android loaders
    $scope.response['ios'][codeName+'Loading'] = 'process';
    $scope.response['android'][codeName+'Loading'] = 'process';
    // getting indicator data
    var request = $.get("http://" + perfDashboardURL + "/get/api/data", {codeName: codeName, start: $rootScope.startDate, end: $rootScope.endDate, past: "true"}, function(results) {
        console.log(results);
        if (results.code === "OK") {
            // rendering ios and android datas
            perfDashboardServices.getDataIntFunc($scope, codeName, results, 'ios');
            perfDashboardServices.getDataIntFunc($scope, codeName, results, 'android');
            // variable to know the number of decimals to use in numbers
            var nb = $scope.response['ios'][codeName].toString().split('.');
            nb = (nb.length == 2) ? nb[1].length : 0;
            // initializing js counters up-down
            new countUp(codeName + "Ios", $scope.previous['ios'][codeName], $scope.response['ios'][codeName], nb, 1, COUNT_OPTIONS).start();
            nb = $scope.response['android'][codeName].toString().split('.');
            nb = (nb.length == 2) ? nb[1].length : 0;
            new countUp(codeName + "Android", $scope.previous['android'][codeName], $scope.response['android'][codeName], nb, 1, COUNT_OPTIONS).start();
        } else {
            // handle error
            perfDashboardServices.getDataIntFuncErr($scope, codeName, results, 'ios');
            perfDashboardServices.getDataIntFuncErr($scope, codeName, results, 'android');
        }
        $scope.$apply();
    });
    perfDashboardServices.allRequests.push(request);
};

// function to get and render indicator data to strings (for top OS for example)
perfDashboardServices.getDataString = function ($rootScope, $scope, codeName) {
    // setting ios and android loaders
    $scope.response.ios[codeName+'Loading'] = 'process';
    $scope.response.android[codeName+'Loading'] = 'process';
    // getting indicator data
    var request = $.get("http://" + perfDashboardURL + "/get/api/data", {codeName: codeName, start: $rootScope.startDate, end: $rootScope.endDate}, function(results) {
        console.log(results);
        if (results.code === "OK") {
            $scope.response.ios[codeName] = "Aucun";
            $scope.response.android[codeName] = "Aucun";
            if (results.ios.datas != undefined)
                $scope.response.ios[codeName] = results.ios.datas[0][0];
            if (results.android.datas != undefined)
                $scope.response.android[codeName] = results.android.datas[0][0];
            $scope.response.ios[codeName+"Loading"] = 'success';
            $scope.response.android[codeName+"Loading"] = 'success';
        } else {
            // handle error
            $scope.response.ios[codeName] = $scope.response.android[codeName] = 'ERROR';
            $scope.response.ios[codeName+"Loading"] = $scope.response.android[codeName+"Loading"] = 'error';
        }
        $scope.$apply();
    });
    perfDashboardServices.allRequests.push(request);
};

// function to render indicator data to ranks number (comparaison between current period and last period)
perfDashboardServices.getDataRankFuncFormat = function ($scope, codeName, results, os, all) {
    var dataPrev = $scope.temp[os][codeName];
    // variable to get ranks by category or top overall
    var nb = all ? 2 : 1;
    // saving previous result to use it during the js count up-down (counting from the previous result to the new one)
    $scope.previous[os][codeName] = (dataPrev == undefined || dataPrev == 'ERROR') ? null : dataPrev;
    // setting new result (current and past period to compare)
    $scope.response[os][codeName] = $scope.response[os][codeName+"Past"] = null;
    if (results[os].datas != undefined && results[os].datas[0][nb] != undefined && results[os].datas[1][nb] != undefined) {
        $scope.response[os][codeName+"Past"] = results[os].datas[0][nb][1];
        $scope.response[os][codeName] = results[os].datas[1][nb][1];
    }
    // setting the trend (up, equal, down) to set the panel color (green, blue, red) and the arrow direction, and the comparaison with the past period
    if ($scope.response[os][codeName+"Past"] == $scope.response[os][codeName]) {
        $scope.response[os][codeName+"Trend"] = "equal";
        $scope.response[os][codeName+"Compare"] = "0"
    }
    else if ($scope.response[os][codeName+"Past"] < $scope.response[os][codeName]) {
        $scope.response[os][codeName+"Trend"] = "down";
        $scope.response[os][codeName+"Compare"] = $scope.response[os][codeName] - $scope.response[os][codeName+"Past"];
    }
    else if ($scope.response[os][codeName+"Past"] > $scope.response[os][codeName]) {
        $scope.response[os][codeName+"Trend"] = "up";
        $scope.response[os][codeName+"Compare"] = $scope.response[os][codeName+"Past"] - $scope.response[os][codeName];
    }
    if ($scope.response[os][codeName] == null) $scope.response[os][codeName] = '--';
    $scope.temp[os][codeName] = $scope.response[os][codeName];
    $scope.response[os][codeName+"Loading"] = 'success';
}

// function to render indicator data to ranks number (redirecting to ranks by category or top overall)
perfDashboardServices.getDataRankFunc = function ($scope, codeName, results, os, err) {
    $scope.response[os][codeName+"Category"] = results[os].datas[0][1][0];
    $scope.response[os][codeName+"AllCategory"] = 'Top Overall';
    if (!err) {
        perfDashboardServices.getDataRankFuncFormat($scope, codeName, results, os, false);
        perfDashboardServices.getDataRankFuncFormat($scope, codeName+'All', results, os, true);
    }
    else {
        perfDashboardServices.getDataIntFuncErr($scope, codeName, results, os);
        perfDashboardServices.getDataIntFuncErr($scope, codeName+'All', results, os);
    }
};

// function to get and render indicator data to ranks number (comparaison between current period and last period, between ios and android)
perfDashboardServices.getDataRank = function ($rootScope, $scope, codeName, COUNT_OPTIONS) {
    $scope.response['ios'][codeName+'Loading'] = $scope.response['android'][codeName+'Loading'] = 'process';
    $scope.response['ios'][codeName+'AllLoading'] = $scope.response['android'][codeName+'AllLoading'] = 'process';
    var request = $.get("http://" + perfDashboardURL + "/get/api/data", {codeName: codeName, start: $rootScope.startDate, end: $rootScope.endDate, past: "true"}, function(results) {
        console.log(results);
        if (results.code === "OK") {
            perfDashboardServices.getDataRankFunc($scope, codeName, results, 'ios', false);
            perfDashboardServices.getDataRankFunc($scope, codeName, results, 'android', false);
            // initializing js counters up-down
            new countUp(codeName + "Ios", $scope.previous['ios'][codeName], $scope.response['ios'][codeName], 0, 1, COUNT_OPTIONS).start();
            new countUp(codeName + "Android", $scope.previous['android'][codeName], $scope.response['android'][codeName], 0, 1, COUNT_OPTIONS).start();
            new countUp(codeName + "AllIos", $scope.previous['ios'][codeName+'All'], $scope.response['ios'][codeName+'All'], 0, 1, COUNT_OPTIONS).start();
            new countUp(codeName + "AllAndroid", $scope.previous['android'][codeName+'All'], $scope.response['android'][codeName+'All'], 0, 1, COUNT_OPTIONS).start();
        } else {
            // handle error
            perfDashboardServices.getDataRankFunc($scope, codeName, results, 'ios', true);
            perfDashboardServices.getDataRankFunc($scope, codeName, results, 'android', true);
        }
        $scope.$apply();
    });
    perfDashboardServices.allRequests.push(request);
};

// function to render ratings indicator data to stars and number (comparaison between current period and last period)
perfDashboardServices.getDataRatingFunc = function ($scope, codeName, results, os) {
    // saving previous result to use it during the js count up-down (counting from the previous result to the new one)
    var dataPrev = $scope.temp[os][codeName];
    $scope.previous[os][codeName] = (dataPrev == undefined || dataPrev == 'ERROR') ? 0 : dataPrev;
    // setting new result (current and past period to compare)
    $scope.response[os][codeName] = $scope.response[os][codeName+"Past"] = 0;
    if (results[os].datas != undefined) {
        $scope.response[os][codeName+"Past"] = results[os].datas[0][1];
        $scope.response[os][codeName+"AllPast"] = results[os].datas[0][2];
        $scope.response[os][codeName] = results[os].datas[1][1];
        $scope.response[os][codeName+"All"] = results[os].datas[1][2];
        // setting the total number of ratings
        $scope.response[os][codeName+"Total"] = results[os].datas[1][2][0] + results[os].datas[1][2][1] +
            results[os].datas[1][2][2] + results[os].datas[1][2][3] + results[os].datas[1][2][4];
    }
    // setting the trend (up, equal, down) to set the panel color (green, blue, red) and the arrow direction, and the comparaison with the past period
    if ($scope.response[os][codeName+"Past"] == $scope.response[os][codeName]) {
        $scope.response[os][codeName+"Trend"] = "equal";
    }
    else if ($scope.response[os][codeName+"Past"] < $scope.response[os][codeName]) {
        $scope.response[os][codeName+"Trend"] = "up";
    }
    else if ($scope.response[os][codeName+"Past"] > $scope.response[os][codeName]) {
        $scope.response[os][codeName+"Trend"] = "down";
    }
    $scope.temp[os][codeName] = $scope.response[os][codeName];
    $scope.response[os][codeName+"Loading"] = 'success';
}

// function to get and render ratings indicator data to stars and number (comparaison between current period and last period, between ios and android)
perfDashboardServices.getDataRating = function ($rootScope, $scope, codeName, COUNT_OPTIONS) {
    $scope.response['ios'][codeName+'Loading'] = $scope.response['android'][codeName+'Loading'] = 'process';
    var request = $.get("http://" + perfDashboardURL + "/get/api/data", {codeName: codeName, start: $rootScope.startDate, end: $rootScope.endDate, past: "true"}, function(results) {
        console.log(results);
        if (results.code === "OK") {
            perfDashboardServices.getDataRatingFunc($scope, codeName, results, 'ios');
            perfDashboardServices.getDataRatingFunc($scope, codeName, results, 'android');
            // initializing readonly js stars
            $('#'+codeName+'Ios').rateit({max: 5, readonly: true, starwidth: 24, starheight: 24});
            $('#'+codeName+'Ios').rateit('value', $scope.response['ios'][codeName]);
            $('#'+codeName+'Android').rateit({max: 5, readonly: true, starwidth: 24, starheight: 24});
            $('#'+codeName+'Android').rateit('value', $scope.response['android'][codeName]);
        } else {
            // handle error
            perfDashboardServices.getDataIntFuncErr($scope, codeName, results, 'ios');
            perfDashboardServices.getDataIntFuncErr($scope, codeName+'All', results, 'android');
        }
        $scope.$apply();
    });
    perfDashboardServices.allRequests.push(request);
};

// setting and displaying error on charts on panels
perfDashboardServices.getChartErr = function ($rootScope, $scope, codeName, chartName) {
    $('#'+chartName).html('<div style="color: #444; margin: 40px auto; width: 120px; text-align: center">Loading Error</div>');
    $scope.response[chartName+"Loading"] = 'error';
};

// function to render ratings indicator data to google chart area
perfDashboardServices.getDataRankToAreaFunc = function ($rootScope, $scope, results, codeName, legends, chartName, CHARTS_OPTIONS, chartType, all) {
    // variable to get ranks by category or top overall
    var nb = all ? 1 : 0;
    var dates = results.ios.dates;
    var ios = results.ios.datas[nb];
    ios = (ios == null) ? null : ios[1];
    var android = results.android.datas[nb];
    android = (android == null) ? null : android[1];
    var datas = [[legends[0], legends[1], legends[2]]];

    // formatting data for chart
    for (var k = 0; k < dates.length; k++) {
        var res = [
            new Date(moment(dates[k], 'YYYYMMDDHHmmss').format($rootScope.perfDateFormat.chart)),
            (ios == null) ? NaN : parseInt(ios[k]),
            (android == null) ? NaN : parseInt(android[k])
        ];
        datas.push(res);
    }

    // translatting data to google datas format
    var data = google.visualization.arrayToDataTable(datas);

    // if the chart alreayd exists, just modifying the data in it
    if (chartName in $rootScope.googleCharts) {
        var chart = $rootScope.googleCharts[chartName].elt;
        $rootScope.googleCharts[chartName].data = data;
    }
    // or creating a new google chart with the datas and saving it
    else {
        var chart = new google.visualization.AreaChart(document.getElementById(chartName));
        $rootScope.googleCharts[chartName] = {
                elt: chart,
                data: data,
                type: chartType,
        };
    }

    // rendering chart in its container
    chart.draw(data, CHARTS_OPTIONS[chartType]);
    $scope.response[chartName+"Loading"] = 'success';
};

// function to get and render ratings indicator data to google chart area (comparaison between ios and android)
perfDashboardServices.getDataRankToArea = function ($rootScope, $scope, codeName, legends, charts, CHARTS_OPTIONS, spark) {
    $scope.response[charts[0]+'Loading'] = 'process';
    $scope.response[charts[1]+'Loading'] = 'process';
    var request = $.get("http://" + perfDashboardURL + "/get/api/data", {codeName: codeName, start: $rootScope.startDate, end: $rootScope.endDate, granularity: $rootScope.perfSettings}, function(results) {
        console.log(results);
        // variable to know if the chart if for a dashboard panel (small and minimalist chart) or its own panel (big and full detailed)
        var chartType = spark ? 'sparkline' : 'area';
        if (results.code === "OK") {
            perfDashboardServices.getDataRankToAreaFunc($rootScope, $scope, results, codeName, legends, charts[0], CHARTS_OPTIONS, chartType, false);
            perfDashboardServices.getDataRankToAreaFunc($rootScope, $scope, results, codeName+'All', legends, charts[1], CHARTS_OPTIONS, chartType, true);
        } else {
            // handle error
            perfDashboardServices.getChartErr($rootScope, $scope, codeName, charts[0]);
            perfDashboardServices.getChartErr($rootScope, $scope, codeName, charts[1]);
        }
        $scope.$apply();
    });
    perfDashboardServices.allRequests.push(request);
};

// function to get and render indicators data to google chart area (comparaison between ios and android)
perfDashboardServices.getDataToAreaChart = function ($rootScope, $scope, codeName, legends, chartName, CHARTS_OPTIONS, spark) {
    $scope.response[chartName+'Loading'] = 'process';
    var request = $.get("http://" + perfDashboardURL + "/get/api/data", {codeName: codeName, start: $rootScope.startDate, end: $rootScope.endDate, granularity: $rootScope.perfSettings}, function(results) {
        console.log(results);
        // variable to know if the chart if for a dashboard panel (small and minimalist chart) or its own panel (big and full detailed)
        var chartType = spark ? 'sparkline' : 'area';
        if (results.code === "OK") {
            var dates = results.ios.dates;
            var ios = results.ios.datas;
            var android = results.android.datas;
            var datas = [[legends[0], legends[1], legends[2]]];

            // formatting data for chart
            for (var k = 0; k < dates.length; k++) {
                var res = [
                    new Date(moment(dates[k], 'YYYYMMDDHHmmss').format($rootScope.perfDateFormat.chart)),
                    Math.round(parseFloat(ios[k][0]) * 100) / 100,
                    Math.round(parseFloat(android[k][0]) * 100) /100
                ];
                datas.push(res);
            }

            // translatting data to google datas format
            var data = google.visualization.arrayToDataTable(datas);

            // if the chart alreayd exists, just modifying the data in it
            if (chartName in $rootScope.googleCharts) {
                var chart = $rootScope.googleCharts[chartName].elt;
                $rootScope.googleCharts[chartName].data = data;
            }
            // or creating a new google chart with the datas and saving it
            else {
                var chart = new google.visualization.AreaChart(document.getElementById(chartName));
                $rootScope.googleCharts[chartName] = {
                        elt: chart,
                        data: data,
                        type: chartType,
                };
            }

            // rendering chart in its container
            chart.draw(data, CHARTS_OPTIONS[chartType]);
            $scope.response[chartName+"Loading"] = 'success';
        } else {
            // handle error
            perfDashboardServices.getChartErr($rootScope, $scope, codeName, chartName);
        }
        $scope.$apply();
    });
    perfDashboardServices.allRequests.push(request);
};

// function to get and render indicators data to google chart columns (comparaison between ios and android)
perfDashboardServices.getDataToColumnChart = function ($rootScope, $scope, codeName, legends, chartName, CHARTS_OPTIONS) {
    $scope.response[chartName+'Loading'] = 'process';
    var request = $.get("http://" + perfDashboardURL + "/get/api/data", {codeName: codeName, start: $rootScope.startDate, end: $rootScope.endDate}, function(results) {
        console.log(results);
        if (results.code === "OK") {
            var datas = [[legends[0], legends[1]]];

            // formatting data for chart
            if (results.datas != undefined) {
                results.datas.map(function(row) {
                    var res = [row[0], Math.round(parseFloat(row[1]) * 100) / 100];
                    datas.push(res); 
                });
            }
            else {
                datas.push(['Aucun', 0]);
            }

            // translatting data to google datas format
            var data = google.visualization.arrayToDataTable(datas);

            // if the chart alreayd exists, just modifying the data in it
            if (chartName in $rootScope.googleCharts) {
                var chart = $rootScope.googleCharts[chartName].elt;
                $rootScope.googleCharts[chartName].data = data;
            }
            // or creating a new google chart with the datas and saving it
            else {
                var chart = new google.visualization.ColumnChart(document.getElementById(chartName));
                $rootScope.googleCharts[chartName] = {
                        elt: chart,
                        data: data,
                        type: 'column',
                };
            }

            // rendering chart in its container
            chart.draw(data, CHARTS_OPTIONS.column);
            $scope.response[chartName+"Loading"] = 'success';
        } else {
            // handle error
            perfDashboardServices.getChartErr($rootScope, $scope, codeName, chartName);
        }
        $scope.$apply();
    });
    perfDashboardServices.allRequests.push(request);
};

// function to get and render indicators data to google chart pie (comparaison between ios and android)
perfDashboardServices.getDataToPieChartCompare = function ($rootScope, $scope, codeName, legends, chartName, CHARTS_OPTIONS, spark) {
    $scope.response[chartName+'Loading'] = 'process';
    var request = $.get("http://" + perfDashboardURL + "/get/api/data", {codeName: codeName, start: $rootScope.startDate, end: $rootScope.endDate}, function(results) {
        console.log(results);
        // variable to know if the chart if for a dashboard panel (small and minimalist chart) or its own panel (big and full detailed)
        var chartType = spark ? 'sparkpie' : 'pie';
        if (results.code === "OK") {

            // formatting data for chart
            var datas = [[legends[0], legends[1]]];
            if (results.ios.datas != undefined && results.android.datas != undefined && (results.ios.datas[0][0] != 0 || results.android.datas[0][0] != 0)) {
                datas.push(['iOS', Math.round(parseFloat(results.ios.datas[0][0]) * 100) / 100]);
                datas.push(['Android', Math.round(parseFloat(results.android.datas[0][0]) * 100) / 100]);
            }
            else datas.push(['Aucun', 1]);

            // translatting data to google datas format
            var data = google.visualization.arrayToDataTable(datas);

            // if the chart alreayd exists, just modifying the data in it
            if (chartName in $rootScope.googleCharts) {
                var chart = $rootScope.googleCharts[chartName].elt;
                $rootScope.googleCharts[chartName].data = data;
            }
            // or creating a new google chart with the datas and saving it
            else {
                var chart = new google.visualization.PieChart(document.getElementById(chartName));
                $rootScope.googleCharts[chartName] = {
                        elt: chart,
                        data: data,
                        type: chartType,
                };
            }

            // rendering chart in its container
            chart.draw(data, CHARTS_OPTIONS[chartType]);
            $scope.response[chartName+"Loading"] = 'success';
        } else {
            // handle error
            perfDashboardServices.getChartErr($rootScope, $scope, codeName, chartName);
        }
        $scope.$apply();
    });
    perfDashboardServices.allRequests.push(request);
};

// function to get and render indicators data to google chart geo
perfDashboardServices.getDataToGeoChartFunc = function ($rootScope, $scope, codeName, legends, chartName, CHARTS_OPTIONS, results) {
    var datas = [[legends[0], legends[1]]];
    if (results != undefined) {

        // formatting data for chart
        results.map(function(row) {
            var res = [row[0], Math.round(parseFloat(row[1]) * 100) / 100];
            datas.push(res);
        });
        //datas.push(['GB', 28]); datas.push(['SE', 24]); datas.push(['AT', 20]); datas.push(['RU', 13]); datas.push(['IT', 7]); datas.push(['PT', 2]);
    }

    // translatting data to google datas format
    var data = google.visualization.arrayToDataTable(datas);

    // if the chart alreayd exists, just modifying the data in it
    if (chartName in $rootScope.googleCharts) {
        var chart = $rootScope.googleCharts[chartName].elt;
        $rootScope.googleCharts[chartName].data = data;
    }
    // or creating a new google chart with the datas and saving it
    else {
        var chart = new google.visualization.GeoChart(document.getElementById(chartName));
        $rootScope.googleCharts[chartName] = {
                elt: chart,
                data: data,
                type: 'geo',
        };
    }

    // rendering chart in its container
    chart.draw(data, CHARTS_OPTIONS.geo);
    $scope.response[chartName+"Loading"] = 'success';
};

// function to get and render indicators data to google chart geo (comparaison between ios and android)
perfDashboardServices.getDataToGeoChart = function ($rootScope, $scope, codeName, legends, charts, CHARTS_OPTIONS) {
    $scope.response[charts[0]+'Loading'] = 'process';
    $scope.response[charts[1]+'Loading'] = 'process';
    var request = $.get("http://" + perfDashboardURL + "/get/api/data", {codeName: codeName, start: $rootScope.startDate, end: $rootScope.endDate}, function(results) {
        console.log(results);
        if (results.code === "OK") {
            perfDashboardServices.getDataToGeoChartFunc($rootScope, $scope, codeName, legends, charts[0], CHARTS_OPTIONS, results.ios.datas);
            perfDashboardServices.getDataToGeoChartFunc($rootScope, $scope, codeName, legends, charts[1], CHARTS_OPTIONS, results.android.datas);
        } else {
            // handle error
            perfDashboardServices.getChartErr($rootScope, $scope, codeName, charts[0]);
            perfDashboardServices.getChartErr($rootScope, $scope, codeName, charts[1]);
        }
        $scope.$apply();
    });
    perfDashboardServices.allRequests.push(request);
};

// function to get and render indicators data to google chart gauge (comparaison between ios and android)
perfDashboardServices.getDataToGaugeChart = function ($rootScope, $scope, codeName, legends, chartName, CHARTS_OPTIONS) {
    $scope.response[chartName+'Loading'] = 'process';
    var request = $.get("http://" + perfDashboardURL + "/get/api/data", {codeName: codeName, start: $rootScope.startDate, end: $rootScope.endDate}, function(results) {
        console.log(results);
        if (results.code === "OK") {

            // formatting data for chart
             var datas = [['Label', 'Value']];
            if (results.ios.datas != undefined)
                datas.push([legends[0], Math.round(parseFloat(results.ios.datas[0][0]) * 100) / 100]);
            else
                datas.push([legends[0], 0]);
            if (results.android.datas != undefined)
                datas.push([legends[1], Math.round(parseFloat(results.android.datas[0][0]) * 100) / 100]);
            else
                datas.push([legends[1], 0]);

            // translatting data to google datas format
            var data = google.visualization.arrayToDataTable(datas);

            // if the chart alreayd exists, just modifying the data in it
            if (chartName in $rootScope.googleCharts) {
                var chart = $rootScope.googleCharts[chartName].elt;
                $rootScope.googleCharts[chartName].data = data;
            }
            // or creating a new google chart with the datas and saving it
            else {
                var chart = new google.visualization.Gauge(document.getElementById(chartName));
                $rootScope.googleCharts[chartName] = {
                        elt: chart,
                        data: data,
                        type: 'gauge',
                };
            }

            // rendering chart in its container
            chart.draw(data, CHARTS_OPTIONS.gauge);
            $scope.response[chartName+"Loading"] = 'success';
        } else {
            // handle error
            perfDashboardServices.getChartErr($rootScope, $scope, codeName, chartName);
        }
        $scope.$apply();
    });
    perfDashboardServices.allRequests.push(request);
};

// function to get and render indicators data to table
perfDashboardServices.getDataToTableFunc = function ($rootScope, $scope, chartName, DATA_TABLE_DEFAULT_OPTIONS, results) {
    var tab = results.datas, dates = results.dates;
    var datas = [];

    // formatting data for table
    if (tab != undefined) {
        for (var k = 0; k < tab.length; k++) {
            var res = [moment(dates[k], 'YYYYMMDDHHmmss').format($rootScope.perfDateFormat.table)];
            for (var i = 0; i < tab[k].length; i++) res.push(tab[k][i]);
            datas.push(res); 
        }
    }

    // if the table alreayd exists, we destroy it
    if ($.fn.dataTable.isDataTable('#'+chartName)) {
        $('#'+chartName).dataTable().fnDestroy();
    }

    // setting table datas
    var dataTableOptions = $.extend({},DATA_TABLE_DEFAULT_OPTIONS);
    dataTableOptions['data'] = datas;

    // rendering table in its container
    $('#'+chartName).dataTable(dataTableOptions);
    $scope.response[chartName+"Loading"] = 'success';
}

// function to get and render indicators data to table (comparaison between ios and android)
perfDashboardServices.getDataToTable = function ($rootScope, $scope, codeName, charts, DATA_TABLE_DEFAULT_OPTIONS) {
    $scope.response[charts[0]+'Loading'] = 'process';
    $scope.response[charts[1]+'Loading'] = 'process';
    var request = $.get("http://" + perfDashboardURL + "/get/api/data", {codeName: codeName, start: $rootScope.startDate, end: $rootScope.endDate, granularity: $rootScope.perfSettings}, function(results) {
        console.log(results);
        if (results.code === "OK") {
            perfDashboardServices.getDataToTableFunc($rootScope, $scope, charts[0], DATA_TABLE_DEFAULT_OPTIONS, results.ios);
            perfDashboardServices.getDataToTableFunc($rootScope, $scope, charts[1], DATA_TABLE_DEFAULT_OPTIONS, results.android);
        } else {
            // handle error
            $scope.response[charts[0]+"Loading"] = 'error';
            $scope.response[charts[1]+"Loading"] = 'error';
        }
        $scope.$apply();
    });
    perfDashboardServices.allRequests.push(request);
};

// function to get and render last pushes listing indicator data to table
perfDashboardServices.getPushListing = function ($rootScope, $scope, codeName, chartName, DATA_TABLE_DEFAULT_OPTIONS) {
    $scope.response[chartName+'Loading'] = 'process';
    // getting the first page of 150 pushes max
    var request = $.get("http://" + perfDashboardURL + "/get/api/data", {codeName: codeName, start: $rootScope.startDate, end: $rootScope.endDate, granularity: $rootScope.perfSettings, limit: 150}, function(results) {
        console.log(results);
        if (results.code === "OK") {

            // setting the api next page url to call when user wants to load more pushes
            $scope.response[chartName+"NextPage"] = results.nextPage;

            var tab = results.datas, dates = results.dates;
            var datas = [];

            // formatting data for table
            if (tab != undefined) {
                for (var k = 0; k < tab.length; k++) {
                    var res = [moment(dates[k], 'YYYYMMDDHHmmss').format('YYYY/MM/DD HH:mm:ss')];
                    for (var i = 0; i < tab[k].length; i++) res.push(tab[k][i]);
                    datas.push(res); 
                }
            }

            // if the table alreayd exists, we destroy it
            if ($.fn.dataTable.isDataTable('#'+chartName)) {
                $('#'+chartName).dataTable().fnDestroy();
            }

            // setting table datas
            var dataTableOptions = $.extend({},DATA_TABLE_DEFAULT_OPTIONS);
            dataTableOptions['data'] = datas;

            // rendering table in its container
            $('#'+chartName).dataTable(dataTableOptions);
            $scope.response[chartName+"Loading"] = 'success';
        } else {
            // handle error
            $scope.response[chartName+"Loading"] = 'error';
        }
        $scope.$apply();
    });
    perfDashboardServices.allRequests.push(request);
};


// function to get and render the last 5 pushes listing on dashboard
perfDashboardServices.getPushListingSpark = function ($rootScope, $scope, codeName, chartName, legends) {
    $scope.response[chartName+'Loading'] = 'process';
    // getting the last 5 pushes
    var request = $.get("http://" + perfDashboardURL + "/get/api/data", {codeName: codeName, start: $rootScope.startDate, end: $rootScope.endDate, granularity: $rootScope.perfSettings, limit: 5}, function(results) {
        console.log(results);
        if (results.code === "OK") {
            var tab = results.datas, dates = results.dates;
            var table = document.getElementById(chartName);
            table.innerHTML = '';

            // putting every push with its infos in a table row and cells, added to the table
            var tr = document.createElement('tr'), td;
            for (var k = 0; k < legends.length; k++) {
                td = document.createElement('td');
                td.appendChild(document.createTextNode(legends[k]));
                tr.appendChild(td);
            }
            table.appendChild(tr);
            if (tab != undefined) {
                for (var k = 0; k < 5; k++) {
                    tr = document.createElement('tr');
                    td = document.createElement('td');
                    td.appendChild(document.createTextNode((k+1)+'.'));
                    tr.appendChild(td);
                    td = document.createElement('td');
                    td.appendChild(document.createTextNode(moment(dates[k], 'YYYYMMDDHHmmss').format('YYYY/MM/DD HH:mm:ss')));
                    tr.appendChild(td);
                    td = document.createElement('td');
                    td.appendChild(document.createTextNode(tab[k][1]));
                    tr.appendChild(td);
                    td = document.createElement('td');
                    td.appendChild(document.createTextNode(tab[k][2]));
                    tr.appendChild(td);
                    table.appendChild(tr);
                }
            }
            $scope.response[chartName+"Loading"] = 'success';
        } else {
            // handle error
            perfDashboardServices.getChartErr($rootScope, $scope, codeName, chartName);
        }
        $scope.$apply();
    });
    perfDashboardServices.allRequests.push(request);
};

// function to render customers reviews in "reviews" route
perfDashboardServices.getReviewsListingFunc = function ($rootScope, $scope, chart, chartName, results) {
    var tab = results.datas, dates = results.dates;
    var wrap = $('#' + chartName);
    wrap.html(' ');
    if (tab != undefined) {
        // rendering each review in a custom div with the title, the author, the date, the stars number and the description
        for (var k = 0; k < tab.length; k++) {
            // getting the stars chart container id
            var starsID = chartName + (($scope.response[chart+"NextPage"] == 'none') ? '00' : $scope.response[chart+"NextPage"] - 1) + '' + k;
            // appending the new review div
            wrap.append('<div class="appReview"><div class="reviewTitle">' + ((tab[k][1] == '') ? '--' : tab[k][1]) + '</div>' +
                        '<div class="reviewDetails">Par <span class="reviewAuthor">' + tab[k][0] + '</span> le ' + moment(dates[k], 'YYYYMMDDHHmmss').format('DD/MM/YYYY') +
                        '<div class="reviewStars" id="' + starsID + '"></div></div>' +
                        '<div class="reviewDescription">' + tab[k][2] + '</div></div>');
            // initializing the stars chart in its container
            $('#'+starsID).rateit({max: 5, readonly: true, starwidth: 24, starheight: 24});
            $('#'+starsID).rateit('value', parseFloat(tab[k][3]));
        }
    }
};


// function to get and render customers reviews in "reviews" route (ios and android)
perfDashboardServices.getReviewsListing = function ($rootScope, $scope, codeName, chartName) {
    $scope.response[chartName+'Loading'] = 'process';
    var request = $.get("http://" + perfDashboardURL + "/get/api/data", {codeName: codeName, start: $rootScope.startDate, end: $rootScope.endDate, nextPage: 1, limit: 200}, function(results) {
        console.log(results);
        if (results.code === "OK") {
            $scope.response[chartName+"NextPage"] = results.nextPage;
            perfDashboardServices.getReviewsListingFunc($rootScope, $scope, chartName, chartName + 'Ios', results.ios);
            perfDashboardServices.getReviewsListingFunc($rootScope, $scope, chartName, chartName + 'And', results.android);
            $scope.response[chartName+"Loading"] = 'success';
        } else {
            // handle error
            perfDashboardServices.getChartErr($rootScope, $scope, codeName, chartName);
        }
        $scope.$apply();
    });
    perfDashboardServices.allRequests.push(request);
};

// function to get and render indicators data to google combo chart (combinaison of differente chart types) (comparaison between ios and android)
perfDashboardServices.getDataToComboChart = function ($rootScope, $scope, codeNames, legends, types, chartName, CHARTS_OPTIONS, spark, $q, $http) {
    $scope.response[chartName+'Loading'] = 'process';
    // variable to know if we have stopped the requests or if we can render the indicator
    var stoper = {stoper: false};
    perfDashboardServices.allStopers.push(stoper);

    var promises = [], promise, combo = [], datas = [];
    // variable to know if the chart if for a dashboard panel (small and minimalist chart) or its own panel (big and full detailed)
    var chartType = spark ? 'sparkcombo' : 'combo';
    var tmp = ['Date'];

    // for each indicator we want to render in the combo chart, we add the corresponding legend and create a promise with the correct api request
    for (var k = 0; k < codeNames.length; k++) {
        // adding corresponding legends
        tmp.push(legends[k]+' iOS');
        tmp.push(legends[k]+' And');
        // creating a canceler to cancel the request before it is completed when the user change route or else
        var canceler = $q.defer();
        perfDashboardServices.allCancelers.push(canceler);
        // creating the promise
        promise = $http({methode: 'GET', url: "http://" + perfDashboardURL + "/get/api/data", timeout: canceler.promise, params: {codeName: codeNames[k], start: $rootScope.startDate, end: $rootScope.endDate, granularity: $rootScope.perfSettings}, cache: false});
        promises.push(promise);
    }
    datas.push(tmp);

    // executing all promises and waiting for all of them to be completed
    $q.all(promises).then(function (results) {

        // formatting datas of each promise for the chart
        var dates = results[0].data.ios.dates;
        for (var k = 0; k < results.length; k++) {
            console.log(results[k].data);
            combo.push({
                ios: results[k].data.ios.datas,
                android: results[k].data.android.datas
            });
        }
        for (var k = 0; k < dates.length; k++) {
            var res = [new Date(moment(dates[k], 'YYYYMMDDHHmmss').format($rootScope.perfDateFormat.chart))];
            for (var i = 0; i < combo.length; i++) {
                res.push(Math.round(parseFloat(combo[i].ios[k][0]) * 100) / 100);
                res.push(Math.round(parseFloat(combo[i].android[k][0]) * 100) / 100);
            }
            datas.push(res);
        }

        // if the period if small enough or granularity big enough to be able to show all the lines and columns correctly with enough visibility on the combo chart, we render the indicators with the different chart types chosen
        // otherwise we use only lines, for a better visibility of all the datas
        var series = {};
        if (!($rootScope.perfSettings == 'Hour' && $rootScope.perfPeriod != 'Day') && !($rootScope.perfSettings == 'Day' && $rootScope.perfPeriod == 'Year')) {
            for (var k = 0; k < types.length; k++)
                series[(k*2)+''] = series[(k*2+1)+''] = {type: types[k]};
        }
        var options = CHARTS_OPTIONS[chartType];
        options['series'] = series;

        // translatting data to google datas format
        var data = google.visualization.arrayToDataTable(datas);

        // if we didnt cancel the requests we can render the indicators datas
        if (!stoper.stoper) {
            // if the chart alreayd exists, just modifying the data in it
            if (chartName in $rootScope.googleCharts) {
                var chart = $rootScope.googleCharts[chartName].elt;
                $rootScope.googleCharts[chartName].data = data;
            }
            // or creating a new google chart with the datas and saving it
            else {
                var chart = new google.visualization.ComboChart(document.getElementById(chartName));
                $rootScope.googleCharts[chartName] = {
                        elt: chart,
                        data: data,
                        type: chartType,
                        series: series
                };
            }

            // rendering chart in its container
            chart.draw(data, options);
            $scope.response[chartName+"Loading"] = 'success';
        }
        //$scope.$apply();
    });
};
