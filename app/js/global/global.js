/* SB-ADMIN-2 */

$(function() {
  $('#side-menu').metisMenu();
});

$(function() {
    $(window).bind("load resize", function() {
        topOffset = 50;
        width = (this.window.innerWidth > 0) ? this.window.innerWidth : this.screen.width;
        if (width < 768) {
            $('div.navbar-collapse').addClass('collapse')
            topOffset = 100; // 2-row-menu
        } else {
            $('div.navbar-collapse').removeClass('collapse')
        }

        height = (this.window.innerHeight > 0) ? this.window.innerHeight : this.screen.height;
        height = height - topOffset;
        if (height < 1) height = 1;
        if (height > topOffset) {
            $("#page-wrapper").css("min-height", (height) + "px");
        }
    })
});

$(function() {
  try {
	  $('.dropdown-menu').click(function(){return false;});
  } catch (e) {}
});

// function to allow user to hide and show panels
$(document).on('click', '.panel-heading', function (e) {
	$(e.currentTarget).next(".panel-body").toggle("fast");
  if (e.currentTarget.getAttribute("data-mytoggle") == 'hidden')
    e.currentTarget.setAttribute("data-mytoggle", "visible");
  else e.currentTarget.setAttribute("data-mytoggle", "hidden");
});

// search bar
$(document).on('click', '.sidebar-search button', function (e) {
    bkPerf.searchPanel();
});

// apply search when enter key is pressed
$('#search-input').on('keyup', function(e) {
    if (e.which == 13) {
        bkPerf.searchPanel();
    }
});

// initializing calendar
$('#datepickerStart').datetimepicker({pickTime: false});
$('#datepickerEnd').datetimepicker({pickTime: false});

/* GLOBAL JS */

var bkPerf = {
  // get google analytics and appfigures configuration (account emain, ios product, android product ...) to show them on dashboard
	getAccounts: function ($rootScope) {
    // get google analytics account email used
    $.get("http://" + perfDashboardURL + "/google/get/email", function (data) {
      if (data.code != "FAIL") {
        $rootScope.google['email'] = data.message;
        $rootScope.$apply();
      }
    });
    // get google analytics accounts (accounts, properties, views) to retrieve ios and android chosen accounts
    $.get("http://" + perfDashboardURL + "/google/get/accounts", function (data) {
      if (data.code != "FAIL") {
        var ios = data.ios;
        var android = data.android;
        var data = data.items;
        for (var i = 0; i < data.length; i++) {
          var account = data[i].name;
          for (var j = 0; j < data[i].webProperties.length; j++) {
            var property = data[i].webProperties[j].name;
            for (var k = 0; k < data[i].webProperties[j].profiles.length; k++) {
              var profile = data[i].webProperties[j].profiles[k].name;
              var id = data[i].webProperties[j].profiles[k].id;
              if (id == ios) {
                $rootScope.google.ios['id'] = ios;
                $rootScope.google.ios['view'] = profile;
                $rootScope.google.ios['property'] = property;
                $rootScope.google.ios['account'] = account;
              }
              if (id == android) {
                $rootScope.google.android['id'] = ios;
                $rootScope.google.android['view'] = profile;
                $rootScope.google.android['property'] = property;
                $rootScope.google.android['account'] = account;
              }
            }
          }
        }
        $rootScope.$apply();
      }
    });
    // get app figures account email used
    $.get("http://" + perfDashboardURL + "/appfigures/get/email", function (data) {
      if (data.code != "FAIL") {
        $rootScope.appfigures['email'] = data.message;
        $rootScope.$apply();
      }
    });
    // get app figures ios chosen product
    $.get("http://" + perfDashboardURL + "/appfigures/get/products/ios", function (data) {
      if (data.code != "FAIL") {
        $rootScope.appfigures.ios['id'] = data.id;
        $rootScope.appfigures.ios['view'] = data.name;
        $rootScope.appfigures.ios['dev'] = data.developer;
        $rootScope.appfigures.ios['icon'] = data.icon;
        $rootScope.$apply();
      }
    });
    // get app figures android chosen product
    $.get("http://" + perfDashboardURL + "/appfigures/get/products/android", function (data) {
      if (data.code != "FAIL") {
        $rootScope.appfigures.android['id'] = data.id;
        $rootScope.appfigures.android['view'] = data.name;
        $rootScope.appfigures.android['dev'] = data.developer;
        $rootScope.appfigures.android['icon'] = data.icon;
        $rootScope.$apply();
      }
    });
  },

  // refresh datas with current page controller
	refreshDatas: function ($rootScope) {
	  if ($rootScope.navigationPart == 'dashboard') {
      angular.element(document.getElementById('DashboardCtrl')).scope().$apply();
      angular.element(document.getElementById('DashboardCtrl')).scope().getDashboard(true);
	  }
	  else {
		  angular.element(document.getElementById('view-container')).scope().$apply();
		  angular.element(document.getElementById('view-container')).scope().getApiData(true);
	  }
	},
	
  // clearing saved google charts (everytime we change route or refresh datas)
	clearCharts: function ($rootScope) {
		Object.keys($rootScope.googleCharts).forEach(function(key) {
		    var chart = $rootScope.googleCharts[key];
		    chart.elt.clearChart();
		});
		$rootScope.googleCharts = {};
	},

  // show/hide panels according to query input
  searchPanel: function () {
      var panels = document.getElementsByClassName('panel');
      var input = document.getElementById('search-input').value;
      var reg = new RegExp(input, 'i');
      for (var i = 0; i < panels.length; i++) {
          if (reg.test(panels[i].textContent))
            panels[i].parentNode.style.display = "block";
          else
            panels[i].parentNode.style.display = "none";
      }
  },

  // disable setting buttons (period, granularity, calendar, refresh) for 2 seconds everytime they are used, to control that user doesnt click many times quickly on the setting buttons
  disableButtons: function () {
      $(".btn-refresh").attr("disabled", "disabled");
      $(".menu-settings button").attr("disabled", "disabled");
      $(".menu-period button").attr("disabled", "disabled");
      $(".menu-calendar button").attr("disabled", "disabled");
      setTimeout(function () {
          $(".btn-refresh").removeAttr("disabled");
          $(".menu-settings button").removeAttr("disabled");
          $(".menu-period button").removeAttr("disabled");
          $(".menu-calendar button").removeAttr("disabled");
      }, 2500);
  },

  // stopping pending requests and rendering datas everytime user changes route or change settings
  stopRequests: function () {
    for (var k = 0; k < perfDashboardServices.allRequests.length; k++)
        perfDashboardServices.allRequests[k].abort();
    for (var k = 0; k < perfDashboardServices.allCancelers.length; k++)
        perfDashboardServices.allCancelers[k].resolve();
    for (var k = 0; k < perfDashboardServices.allStopers.length; k++)
        perfDashboardServices.allStopers[k].stop = true;
    perfDashboardServices.allRequests = [];
    perfDashboardServices.allCancelers = [];
    perfDashboardServices.allStopers = [];
  },

  // function called when user clicks "load more pushes" button on "pushes" route
  loadMorePushes: function (chartName) {
    var $scope = angular.element(document.getElementById('view-container')).scope();
    var nextPage = $scope.response[chartName+'NextPage'];
    if (nextPage != 'none') {
        $scope.response[chartName+'NextLoading'] = 'process';
        $scope.$apply();
        // asking the next pushes to API (urban airship "next page" previously set) and adding them at the end of the table
        $.get("http://" + perfDashboardURL + "/get/api/data", {codeName: 'listing', nextPage: nextPage}, function(results) {
            console.log(results);
            if (results.code === "OK") {
                $scope.response[chartName+"NextPage"] = results.nextPage;
                var t = $('#'+chartName).DataTable();
                var tab = results.datas, dates = results.dates;
                if (tab != undefined) {
                    for (var k = 0; k < tab.length; k++) {
                        var res = [moment(dates[k], 'YYYYMMDDHHmmss').format('YYYY/MM/DD HH:mm:ss')];
                        for (var i = 0; i < tab[k].length; i++) res.push(tab[k][i]);
                        t.row.add(res);
                    }
                    t.draw();
                }
                $scope.response[chartName+"NextLoading"] = 'success';
            } else {
                $scope.response[chartName+"NextLoading"] = 'error';
            }
            $scope.$apply();
            });
    }
  },

  // function to add new reviews at the end of reviews container
  loadMoreReviewsFunc: function ($scope, chart, chartName, results) {
    var tab = results.datas, dates = results.dates;
    var wrap = $('#' + chartName);
    if (tab != undefined) {
        for (var k = 0; k < tab.length; k++) {
            var starsID = chartName + (($scope.response[chart+"NextPage"] == 'none') ? '00' : $scope.response[chart+"NextPage"] - 1) + '' + k;
            wrap.append('<div class="appReview"><div class="reviewTitle">' + tab[k][1] + '</div>' +
                        '<div class="reviewDetails">Par <span class="reviewAuthor">' + tab[k][0] + '</span> le ' + moment(dates[k], 'YYYYMMDDHHmmss').format('DD/MM/YYYY') +
                        '<div class="reviewStars" id="' + starsID + '"></div></div>' +
                        '<div class="reviewDescription">' + tab[k][2] + '</div></div>');
            $('#'+starsID).rateit({max: 5, readonly: true, starwidth: 24, starheight: 24});
            $('#'+starsID).rateit('value', parseFloat(tab[k][3]));
        }
    }
  },

  // function called when user clicks "load more reviews" button on "ratings" route
  loadMoreReviews: function (chartName) {
    var $scope = angular.element(document.getElementById('view-container')).scope();
    var $rootScope = $scope.$root;
    var nextPage = $scope.response[chartName+'NextPage'];
    if (nextPage != 'none') {
        $scope.response[chartName+'NextLoading'] = 'process';
        $scope.$apply();
        // asking the next reviews to API (app figures "next page" previously set) and adding them at the end of the container
        $.get("http://" + perfDashboardURL + "/get/api/data", {codeName: 'reviews', start: $rootScope.startDate, end: $rootScope.endDate, nextPage: nextPage, limit: 200}, function(results) {
            console.log(results);
            if (results.code === "OK") {
                $scope.response[chartName+"NextPage"] = results.nextPage;
                bkPerf.loadMoreReviewsFunc($scope, chartName, chartName + 'Ios', results.ios);
                bkPerf.loadMoreReviewsFunc($scope, chartName, chartName + 'And', results.android);
                $scope.response[chartName+"NextLoading"] = 'success';
            } else {
                $scope.response[chartName+"NextLoading"] = 'error';
            }
            $scope.$apply();
            });
    }
  },

  // setting a cookie with name, value and expirtion dae
  setCookie: function (cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires + "; path=/";
  },

  // getting a cookie by name
  getCookie: function (cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
    }
    return "";
  }
};
