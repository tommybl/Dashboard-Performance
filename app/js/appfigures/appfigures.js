var appfigures = {

    // getting app figures access token after app figures authentition success
    oauthCallback: function () {
        $.get("http://" + perfDashboardURL + "/appfigures/oauth1/access", function (data) {
            console.log(data);
            var loginElt = document.getElementById('appfigures-login-button');
            var logoutElt = document.getElementById('appfigures-logout-button');
            loginElt.style.display = 'none';
            logoutElt.style.display = 'initial';
            appfigures.getEmail();
            appfigures.getProducts(true);
        });
    },

    // getting app figures email to display it on page
    getEmail: function () {
        $.get("http://" + perfDashboardURL + "/appfigures/get/email", function (data) {
            console.log(data);
            angular.element(document).injector().invoke(function($rootScope) {
                $rootScope.appfigures['email'] = data.message;
                document.getElementById('appfigures-account-email').style.display = 'block';
                $rootScope.$apply();
            });
        });
    },

    // getting app figures products to display them in select inputs so the user chose app figures configuration
    getProducts: function (show) {
        $.get("http://" + perfDashboardURL + "/appfigures/get/products", function (data) {
            console.log(data);
            var viewElt = document.getElementById('appfigures-view-selector');
            var ddData = [];
            Object.keys(data).forEach(function(key) {
                var options = {
                    text: data[key].name,
                    value: data[key].id,
                    selected: false,
                    description: data[key].developer,
                    imageSrc: data[key].icon
                };
                if (data[key].developer === "")
                    options["description"] = "Unknown";
                ddData.push(options);
            });
            $('#appfigures-selector-ios').ddslick({
                data: ddData,
                imagePosition: "left",
                width: 300
            });
            $('#appfigures-selector-android').ddslick({
                data: ddData,
                imagePosition: "left",
                width: 300
            });
            if (show) viewElt.style.display = 'initial';
        });
    }
};