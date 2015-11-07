/* javascript for connectors configuration page */

// when client clicks on "modifier" button to change urban airship configuration
$(document).on('click', '#urbanairship-logout-button', function (e) {
     $.get("http://" + perfDashboardURL + "/urbanairship/logout", function (data) {
        if (data.code == "OK") location.reload();
        else {
            var newdiv = $('<div class="alert alert-danger alert-dismissible fade in" role="alert"><button type="button" class="close" onclick="this.parentNode.style.display=\'none\'"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button><span>Couldn\'t logout urbanairship configuration, something went wrong. Please try again.</span></div>');
            $("#urbanairship-logout-button").after(newdiv);
        }
    });
});

// when client clicks on "valider" button to save urban airship chosen configuration
$(document).on('click', '#urbanairship-save-button', function (e) {
    var body = {
        'ua_key': document.getElementById('ua-key-input').value,
        'ua_master': document.getElementById('ua-master-input').value
    };
    $.post("http://" + perfDashboardURL + "/configuration/urbanairship", body, function (data) {
        if (data.code == "FAIL") {
            document.getElementById('ua-config-error-mess').innerHTML = data.message;
            document.getElementById('ua-config-saved').style.display = 'none';
            document.getElementById('ua-config-error').style.display = 'block';
        }
        else {
            document.getElementById('ua-config-saved-mess').innerHTML = data.message;
            document.getElementById('ua-config-error').style.display = 'none';
            document.getElementById('ua-config-saved').style.display = 'block';
            document.getElementById('ua-config-unauthorized').style.display = 'none';
            document.getElementById('ua-config-authorized').style.display = 'block';
        }
    });
});

// when client clicks on "configurer" button to log in google and chose configuration
$(document).on('click', '#google-login-button', function (e) {
    var w = window.open('', "_blank", "height=600,width=600");
    $.ajax({
        url: "http://" + perfDashboardURL + "/google/oauth2/request",
        success: function (data) {
            if (data.code == 'OK') {
                w.location.replace(data.message);
            }
        },
        async: false
    });
});

// when client clicks on "modifier" button to change google analytics configuration
$(document).on('click', '#google-logout-button', function (e) {
     $.get("http://" + perfDashboardURL + "/google/logout", function (data) {
        if (data.code == "OK") location.reload();
        else {
            var newdiv = $('<div class="alert alert-danger alert-dismissible fade in" role="alert"><button type="button" class="close" onclick="this.parentNode.style.display=\'none\'"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button><span>Couldn\'t logout google configuration, something went wrong. Please try again.</span></div>');
            $("#google-logout-button").after(newdiv);
        }
    });
});

// when client clicks on "valider" button to save google analytics chosen configuration
$(document).on('click', '#google-save-button', function (e) {
    var iosData = $('#google-selector-ios').data('ddslick').selectedData;
    var androidData = $('#google-selector-android').data('ddslick').selectedData;
    var body = {
        'ga_ios': iosData.value,
        'ga_android': androidData.value
    };
    $.post("http://" + perfDashboardURL + "/configuration/google", body, function (data) {
        if (data.code == "FAIL") {
            document.getElementById('ga-config-error-mess').innerHTML = data.message;
            document.getElementById('ga-config-saved').style.display = 'none';
            document.getElementById('ga-config-error').style.display = 'block';
        }
        else {
            angular.element(document).injector().invoke(function($rootScope) {
                // setting google analytics configuration infos (ios and android ids and paths - account > property > view) to display on pages
                $rootScope.google.ios['id'] = iosData.value;
                $rootScope.google.ios['view'] = iosData.text;
                var properties = iosData.description.split(' > ');
                $rootScope.google.ios['property'] = properties[1];
                $rootScope.google.ios['account'] = properties[0];
                $rootScope.google.android['id'] = androidData.value;
                $rootScope.google.android['view'] = androidData.text;
                properties = androidData.description.split(' > ');
                $rootScope.google.android['property'] = properties[1];
                $rootScope.google.android['account'] = properties[0];
                $rootScope.$apply();
                document.getElementById('ga-config-saved-mess').innerHTML = data.message;
                document.getElementById('ga-config-error').style.display = 'none';
                document.getElementById('ga-config-saved').style.display = 'block';
                document.getElementById('google-view-selector').style.display = 'none';
                document.getElementById('ga-config-authorized').style.display = 'block';
            });
        }
    });
});

// when client clicks on "configurer" button to log in app figures and chose configuration
$(document).on('click', '#appfigures-login-button', function (e) {
    var w = window.open('', "_blank", "height=600,width=600");
    $.ajax({
        url: "http://" + perfDashboardURL + "/appfigures/oauth1/request",
        success: function (data) {
            if (data.code == 'OK') {
                w.location.replace(data.message);
            }
        },
        async: false
    });
});

// when client clicks on "modifier" button to change app figures configuration
$(document).on('click', '#appfigures-logout-button', function (e) {
     $.get("http://" + perfDashboardURL + "/appfigures/logout", function (data) {
        if (data.code == "OK") location.reload();
        else {
            var newdiv = $('<div class="alert alert-danger alert-dismissible fade in" role="alert"><button type="button" class="close" onclick="this.parentNode.style.display=\'none\'"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button><span>Couldn\'t logout appfigures configuration, something went wrong. Please try again.</span></div>');
            $("#appfigures-logout-button").after(newdiv);
        }
    });
});

// when client clicks on "valider" button to save app figures chosen configuration
$(document).on('click', '#appfigures-save-button', function (e) {
    var iosData = $('#appfigures-selector-ios').data('ddslick').selectedData;
    var androidData = $('#appfigures-selector-android').data('ddslick').selectedData;
    var body = {
        'af_ios': iosData.value,
        'af_android': androidData.value
    };
    $.post("http://" + perfDashboardURL + "/configuration/appfigures", body, function (data) {
        if (data.code == "FAIL") {
            document.getElementById('af-config-error-mess').innerHTML = data.message;
            document.getElementById('af-config-saved').style.display = 'none';
            document.getElementById('af-config-error').style.display = 'block';
        }
        else {
            angular.element(document).injector().invoke(function($rootScope) {
                // setting app figures configuration infos (ios and android ids, apps name, developer and icon) to display on pages
                $rootScope.appfigures.ios['id'] = iosData.value;
                $rootScope.appfigures.ios['view'] = iosData.text;
                $rootScope.appfigures.ios['dev'] = iosData.description;
                $rootScope.appfigures.ios['icon'] = iosData.imageSrc;
                $rootScope.appfigures.android['id'] = androidData.value;
                $rootScope.appfigures.android['view'] = androidData.text;
                $rootScope.appfigures.android['dev'] = androidData.description;
                $rootScope.appfigures.android['icon'] = androidData.imageSrc;
                $rootScope.$apply();
                document.getElementById('af-config-saved-mess').innerHTML = data.message;
                document.getElementById('af-config-error').style.display = 'none';
                document.getElementById('af-config-saved').style.display = 'block';
                document.getElementById('appfigures-view-selector').style.display = 'none';
                document.getElementById('af-config-authorized').style.display = 'block';
            });
        }
    });
});

