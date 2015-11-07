/*var nowTime = new Date().getTime();
$('#time-counter').html(parseInt(((new Date().getTime()) - nowTime)/1000));
setInterval(function() {
	$('#time-counter').html(parseInt(((new Date().getTime()) - nowTime)/1000));
}, 1000);*/

var googleAnalytics = {
	
    // getting google analytics access token after google analytics authentition success
	oauthCallback: function () {
		console.log("test");
        $.get("http://" + perfDashboardURL + "/google/oauth2/access", function (data) {
            console.log(data);
            var loginElt = document.getElementById('google-login-button');
            var logoutElt = document.getElementById('google-logout-button');
            loginElt.style.display = 'none';
            logoutElt.style.display = 'initial';
            googleAnalytics.getEmail();
            googleAnalytics.getProducts();
        });
    },

    // getting google analytics email to display it on page
    getEmail: function () {
        $.get("http://" + perfDashboardURL + "/google/get/email", function (data) {
            console.log(data);
            angular.element(document).injector().invoke(function($rootScope) {
                $rootScope.google['email'] = data.message;
                document.getElementById('google-account-email').style.display = 'block';
                $rootScope.$apply();
            });
        });
    },

    // getting google analytics accounts to display them in select inputs so the user chose google analytics configuration
    getProducts: function () {
        $.get("http://" + perfDashboardURL + "/google/get/products", function (data) {
            console.log(data);
            var viewElt = document.getElementById('google-view-selector');
            var ddData = [];
            for (var i = 0; i < data.length; i++) {
            	var account = data[i].name;
            	for (var j = 0; j < data[i].webProperties.length; j++) {
            		var property = data[i].webProperties[j].name;
            		for (var k = 0; k < data[i].webProperties[j].profiles.length; k++) {
            			var profile = data[i].webProperties[j].profiles[k].name;
            			var id = data[i].webProperties[j].profiles[k].id;
            			var options = {
		                    text: profile,
		                    value: id,
		                    description: account + ' > ' + property,
		                    selected: false
		                };
		                ddData.push(options);
            		}
            	}
            }
            $('#google-selector-ios').ddslick({
                data: ddData,
                width: 300
            });
            $('#google-selector-android').ddslick({
                data: ddData,
                width: 300
            });
            viewElt.style.display = 'initial';
        });
    },
};