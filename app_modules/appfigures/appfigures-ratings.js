var moment = require('moment');
var request = require('request');
var bkPerf = require('../bkPerf');
var Promise = require('promise');

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

exports.query = function (codeName, route, start, end, session, client, res, limiter) {
    // app figures ratings api doesnt accept granularity so we always respond as if the option "past" was set to true (past and now period, with no step)

    // setting api queries (past and current period) (with appfigures we can retrieve datas from 2 products at once)
    var query = {
        url: client.base + route,
        headers: {
            'X-Client-Key': client.clientKey,
            'Authorization': session.user['af_authorization']},
        qs: {
            'products': session.user['af_ios'] + ';' + session.user['af_android'],
            'start': start,
            'end': end,
            'group_by': 'product'
        }
    };
    var queryPast = {
        url: client.base + route,
        headers: {
            'X-Client-Key': client.clientKey,
            'Authorization': session.user['af_authorization']},
        qs: {
            'products': session.user['af_ios'] + ';' + session.user['af_android'],
            'start': bkPerf.getLastStart(start, end),
            'end': start,
            'group_by': 'product'
        }
    };

    // taking 2 requests if past is set (to retrieve the last period too), otherwise 1 (ios and android at once)
    limiter.removeTokens(2, function () {
        var promises = [];
        promises.push(promiseQuery(query));
        promises.push(promiseQuery(queryPast));
        // executing all promises and waiting for them to be completed
        Promise.all(promises).then(function (response) {
            // setting the response
            // if there is past we format the datas retrieved without granularity
            // as explained in the documentation, the response contained ios and android datas
            // each object (ios and android) has a dates object and a datas object
            // dates will be an empty array
            // datas is an array of arrays. The first array containing the past datas, the second one containing the current datas (average and breakdown)
            // average is a number corresponding to the average star rating for the given parameters
            // breakdown is an array containing the number of ratings for 1-5 star ratings. The array will always contain five numbers with the first being the number of 1 star ratings and last of 5
            // example: [['past', 4.5, [29, 87, 43, 88, 91], ['now', 3.33, [12, 24, 11, 11, 32]]]
            var result = {
                code: "OK",
                codeName: codeName,
                ios: {
                    dates: [],
                    datas: [
                        ['past', parseFloat(response[1][session.user['af_ios']+''].average), response[1][session.user['af_ios']+''].breakdown],
                        ['now', parseFloat(response[0][session.user['af_ios']+''].average), response[0][session.user['af_ios']+''].breakdown]
                    ]
                },
                android: {
                    dates: [],
                    datas: [
                        ['past', parseFloat(response[1][session.user['af_android']+''].average), response[1][session.user['af_android']+''].breakdown],
                        ['now', parseFloat(response[0][session.user['af_android']+''].average), response[0][session.user['af_android']+''].breakdown]
                    ]
                }
            }
            res.end(JSON.stringify(result));
        }, function (error) {
            res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Impossible de récupérer les données App Figures.'}));
        });
    });
};