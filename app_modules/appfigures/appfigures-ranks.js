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

// translatting datas from app figures datas format to our own datas format
function datasFormat(datas, session) {
    var datasIos = [], datasAnd = [], datasOS, dates = [];
    for (var k = 0; k < datas.dates.length; k++)
        dates.push(moment(datas.dates[k], 'YYYY-MM-DDTHH:mm:ss').format('YYYYMMDDHHmmss'));
    datas = datas.data;
    for (var k = 0; k < datas.length; k++) {
        if (datas[k].category.device == 'handheld') {
            datasOS = (datas[k]['product_id'] == session.user['af_android']) ? datasAnd : datasIos;
            datasOS.push([datas[k].category.name, datas[k].positions]);
        }
    }
    return {dates: dates, ios: datasIos, android: datasAnd};
}

// translatting datas from app figures datas format to our own datas format
function datasFormatCompare(datas, session) {
    var datasIos = [], datasAnd = [], datasOS;
    for (var k = 0; k < datas.length; k++) {
        if (datas[k].category.device == 'handheld') {
            datasOS = (datas[k]['product_id'] == session.user['af_android']) ? datasAnd : datasIos;
            datasOS.push([datas[k].category.name, datas[k].positions[datas[k].positions.length - 1]]);
        }
    }
    return {ios: datasIos, android: datasAnd};
}

exports.query = function (codeName, route, start, end, granularity, past, session, client, res, limiter) {
    // the datas retrieve will have a step if the request option granularity has been set
    var hasStep = bkPerf.granularityIsSet(granularity);
    // number of days in the period
    var diff = bkPerf.getDiffDays(start, end);
    diff = (diff > 30) ? 30 : diff;
    // app figures ranks api only accept a period and granularity of 32 datas maximum, it will fail otherwise
    // so if period as 1 day, we set the granularity hourly, otherwise daily, and to 30 days maximum
    granularity = (diff == 1) ? 'hourly' : 'daily';

    // getting start and end dates, for current and past period (30 days maximum per period)
    var startDate = {
        now: moment(start, 'YYYY-MM-DD').subtract(diff, 'days').format('YYYY-MM-DD'),
        past: moment(start, 'YYYY-MM-DD').subtract(diff * 2, 'days').format('YYYY-MM-DD')
    };
    var endDate = {
        now: start,
        past: moment(start, 'YYYY-MM-DD').subtract(diff, 'days').format('YYYY-MM-DD')
    };

    // setting api queries (past and current period) (with appfigures we can retrieve datas from 2 products at once)
    var query = {
        url: client.base + route + '/' + session.user['af_ios'] + ';' + session.user['af_android'] + '/' + granularity + '/' + startDate.now + '/' + endDate.now,
        headers: {
            'X-Client-Key': client.clientKey,
            'Authorization': session.user['af_authorization']},
        qs: {'countries': 'fr'}
    };
    var queryPast = {
        url: client.base + route + '/' + session.user['af_ios'] + ';' + session.user['af_android'] + '/' + granularity + '/' + startDate.past + '/' + endDate.past,
        headers: {
            'X-Client-Key': client.clientKey,
            'Authorization': session.user['af_authorization']},
        qs: {'countries': 'fr'}
    };

    // taking 2 requests if past is set (to retrieve the last period too), otherwise 1 (ios and android at once)
    limiter.removeTokens((past ? 2 : 1), function () {
        if (past) {
            // if past is true, the datas retrieved wont have step (granularity) and the response will have arrays of dates empty
            // if past is true, creating 2 promises (past period and now)
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
                // datas is an array of arrays. The first array containing the past datas, the second one containing the current datas (by category and top overall)
                // example: [['past', ['finance', 42], ['top overall', 1337]], ['now', ['finance', 42], ['top overall', 1337]]]
                var datasNow = datasFormatCompare(response[0].data, session);
                var datasPast = datasFormatCompare(response[1].data, session);
                var result = {
                    code: "OK",
                    codeName: codeName,
                    ios: {
                        dates: [],
                        datas: [['past', datasPast.ios[0], datasPast.ios[1]], ['now', datasNow.ios[0], datasNow.ios[1]]]
                    },
                    android: {
                        dates: [],
                        datas: [['past', datasPast.android[0], datasPast.android[1]], ['now', datasNow.android[0], datasNow.android[1]]]
                    }
                };
                res.end(JSON.stringify(result));
            }, function (error) {
                res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Impossible de récupérer les données App Figures.'}));
            });
        }
        else {
            request(query, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var datas = JSON.parse(body);
                    if (!hasStep) {
                        datas = datasFormatCompare(datas.data, session);
                        var result = {
                            code: "OK",
                            codeName: codeName,
                            ios: {
                                dates: [],
                                datas: [[datas.ios[0], datas.ios[1]]]
                            },
                            android: {
                                dates: [],
                                datas: [[datas.android[0], datas.android[1]]]
                            }
                        };
                    }
                    else {
                        // if there is step (granularity) we format the datas retrieved with granularity
                        // as explained in the documentation, the response contained ios and android datas
                        // each object (ios and android) has a dates object and a datas object
                        // dates is an array of dates with the format YYYYMMDDHHmmss
                        // datas is an array of arrays (one array for one date, each array containing one or many datas) (by category and top overall)
                        // example: [['finance', [42, 1337, 1, ...]], ['top overall', [42, 1337, 1, ...]]]
                        datas = datasFormat(datas, session);
                        var result = {
                            code: "OK",
                            codeName: codeName,
                            ios: {
                                dates: datas.dates,
                                datas: [datas.ios[0], datas.ios[1]]
                            },
                            android: {
                                dates: datas.dates,
                                datas: [datas.android[0], datas.android[1]]
                            }
                        };
                    }
                    res.end(JSON.stringify(result));
                }
                else {
                    res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Impossible de récupérer les données App Figures.'}));
                }
            });
        }
    });
};