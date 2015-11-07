var moment = require('moment');
var request = require('request');
var bkPerf = require('../bkPerf');

exports.query = function (codeName, route, start, end, limit, nextPage, session, client, res, limiter) {
    // if the query has a nextPage option set (containing a url to call urban airship api), the user has asked to load more pushes
    // we use this url to retrieve the next pushes from this page
    if (nextPage != undefined) {
        var query = {
            url: nextPage,
            headers: {'Authorization': session.user['ua_authorization']}
        };
    }
    // otherwise we create a query to retrieve the pushes from the first page (the most recent), with a limit (ex: max 200 per page)
    else {
        var query = {
            url: client.base + route,
            headers: {'Authorization': session.user['ua_authorization']},
            qs: {
                'start': start,
                'end': end,
                'limit': limit
            }
        };
    }

    function errorCallback (error) {
        res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Impossible de récupérer les données Urban Airship.'}));
    }

    function nowCallback (error, response, body) {
        if (!error && response.statusCode == 200) {
            var datas = JSON.parse(body);
            // we set the nextPage option in the response, an url that will be used to load more pushes
            nextPage = datas['next_page'];
            // we format the datas retrieved (list of pushes with infos)
            // translatting datas from urban airship datas format to our own datas format
            datas = datas['pushes'];
            var dates = [], tabs = [];
            for (var i = 0; i < datas.length; i++) {
                dates.push(moment((datas[i])['push_time'], 'YYYY-MM-DD HH:mm:ss').format('YYYYMMDDHHmmss'));
                tabs.push([(datas[i])['push_uuid'], (datas[i])['push_type'].split('_')[0].toLowerCase(), (datas[i])['sends'], (datas[i])['direct_responses']]);
            }
            var result = {
                code: "OK",
                codeName: codeName,
                dates: dates,
                datas: tabs,
                nextPage: (nextPage == undefined) ? 'none' : nextPage
            };
            res.end(JSON.stringify(result));
        }
        else {errorCallback(error);}
    }

    limiter.removeTokens(1, function () {
        request(query, nowCallback);
    });
};