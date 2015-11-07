var request = require('request');
var moment = require('moment');

// getting connector setting corresponding to the granularity chosen
exports.getGranularity = function (granularity, option) {
    if (granularity === 'hourly') {
        if (option == 'ga') return 'ga:date,ga:hour';
        if (option == 'af') return 'daily';
        if (option == 'ua') return 'HOURLY';
    }
    else if (granularity === 'daily') {
        if (option == 'ga') return 'ga:date';
        if (option == 'af') return 'daily';
        if (option == 'ua') return 'DAILY';
    }
    else if (granularity === 'weekly') {
        if (option == 'ga') return 'ga:yearWeek';
        if (option == 'af') return 'weekly';
        if (option == 'ua') return 'DAILY';
    }
    else if (granularity === 'monthly') {
        if (option == 'ga') return 'ga:yearMonth';
        if (option == 'af') return 'monthly';
        if (option == 'ua') return 'MONTHLY';
    }
    else if (granularity === 'yearly') {
        if (option == 'ga') return 'ga:year';
        if (option == 'af') return 'yearly';
        if (option == 'ua') return 'MONTHLY';
    }
};

// verifying if granularity option is set in the indicator request
exports.granularityIsSet = function (granularity) {
    if (granularity == 'hourly' || granularity == 'daily' || granularity == 'weekly' || granularity == 'monthly' || granularity == 'yearly')
        return true;
    return false;
};

// getting the start date of the previous period
exports.getLastStart = function (start, end) {
    var a = moment(start, 'YYYY-MM-DD');
    var b = moment(end, 'YYYY-MM-DD');
    var diff = b.diff(a, 'days');
    return moment(start, 'YYYY-MM-DD').subtract(diff, 'days').format('YYYY-MM-DD');
};

// getting the difference of days between the start and end date
exports.getDiffDays = function (start, end) {
    var a = moment(start, 'YYYY-MM-DD');
    var b = moment(end, 'YYYY-MM-DD');
    return diff = b.diff(a, 'days');
};

// getting a random string of 40 caracters
exports.randomString = function () {
    var result = [];
    var strLength = 40;
    var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    while (strLength--) {
        result.push(charSet.charAt(Math.floor(Math.random() * charSet.length)));
    }
    return result.join('');
};

// translatting a string to base64
exports.StringToBase64 = function (str) {
    return new Buffer(str).toString("base64");
}

// translatting base64 to a string
exports.Base64ToString = function (str) {
    return new Buffer(str).toString("ascii");
}

// function to refresh the google access token using the refresh token saved
exports.refreshGoogleToken = function (session, pool, client, res) {
    console.log("refresh google token");
    var options = {
        url: 'https://www.googleapis.com/oauth2/v3/token',
        form: {
            'client_id': client.clientKey,
            'client_secret': client.clientSecret,
            'refresh_token': session.user['ga_refresh'],
            'grant_type': 'refresh_token'
        }
    };
    // asking for the new access token
    request.post(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            body = JSON.parse(body);
            var token = body['access_token'];
            // saving the new access token in database
            pool.getConnection(function (err, connection) {
                if (err) {
                    // if there is an error we logout the user
                    if (res != undefined) res.redirect('/logout');
                }
                else {
                   var query = 'UPDATE account SET ga_token = \'' + token + '\' WHERE ID = ' + session.user['account_id'];
                    connection.query(query , function (err, rows) {
                        if (err) {
                            if (res != undefined) res.redirect('/logout');
                        }
                        // if the new token is successfully saved, we save it in the session and set the new google authorization header
                        else if (session != undefined && session.user != undefined) {
                            session.user['ga_token'] = token;
                            session.user['ga_authorization'] = 'Bearer ' + session.user['ga_token'];
                            session.save(function (err) {});
                            if (res != undefined) res.redirect('/');
                        }
                        connection.release();
                    });
                }
            });
        }
        else if (res != undefined) res.redirect('/logout');
    });
}