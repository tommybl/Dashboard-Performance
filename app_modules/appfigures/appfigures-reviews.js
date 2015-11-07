var moment = require('moment');
var request = require('request');
var bkPerf = require('../bkPerf');

// creating a promise from a query
function promiseQuery (query) {
    var promise = new Promise(function (resolve, reject) {
        request(query, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var datas = JSON.parse(body);
                resolve(datas);
            }
            else reject(error);
        });
    });
    return promise;
}

exports.query = function (codeName, route, start, end, limit, page, session, client, res, limiter) {
    // app figures reviews api doesnt accept granularity so we always respond as if the option neither "past" nor "granularity" options were set
    // we retrieve a list of reviews for the current period, with a "limit"

    // setting api queries (only current period) (with appfigures we can retrieve datas from 2 products at once)
    var query = {
        url: client.base + route,
        headers: {
            'X-Client-Key': client.clientKey,
            'Authorization': session.user['af_authorization']},
        qs: {
            'products': session.user['af_ios'] + ',' + session.user['af_android'],
            'start': start,
            'end': end,
            // setting the page of the reviews to retrieve (ex: 1, 2, 3 etc)
            'page': page,
            'count': limit
        }
    };

    // taking 1 request
    limiter.removeTokens(1, function () {
        request(query, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var datas = JSON.parse(body);
                // setting the next page option to send in the response, that will be used if the user want to load more reviews
                if (datas['this_page'] == datas['pages']) nextPage = 'none';
                else nextPage = datas['this_page'] + 1;
                // formatting datas
                // translatting datas from app figures datas format to our own datas format
                datas = datas['reviews'];
                var datesIos = [], datesAnd = [], tabsIos = [], tabsAnd = [];
                for (var i = 0; i < datas.length; i++) {
                    if (datas[i]['product'] == session.user['af_ios']) {
                        datesIos.push(moment((datas[i])['date'], 'YYYY-MM-DDTHH:mm:ss').format('YYYYMMDDHHmmss'));
                        tabsIos.push([(datas[i])['author'], (datas[i])['title'], (datas[i])['review'], (datas[i])['stars']]);
                    }
                    else {
                        datesAnd.push(moment((datas[i])['date'], 'YYYY-MM-DDTHH:mm:ss').format('YYYYMMDDHHmmss'));
                        tabsAnd.push([(datas[i])['author'], (datas[i])['title'], (datas[i])['review'], (datas[i])['stars']]);
                    }
                }
                var result = {
                    code: "OK",
                    codeName: codeName,
                    ios: {
                        dates: datesIos,
                        datas: tabsIos
                    },
                    android: {
                        dates: datesAnd,
                        datas: tabsAnd
                    },
                    nextPage: nextPage
                };
                res.end(JSON.stringify(result));
            }
            else res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Impossible de récupérer les données App Figures.'}));
        });
    });
};