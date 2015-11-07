var moment = require('moment');
var request = require('request');
var bkPerf = require('../bkPerf');
var Promise = require('promise');

// creating queries with the right options
function createQuery(os, past, client, session, metrics, dimensions, sort, start, end) {
    var query = {
        url: client.base,
        headers: {'Authorization': session.user['ga_authorization']},
        qs: {
            'ids': 'ga:' + session.user['ga_' + os],
            'metrics': metrics,
            'dimensions': dimensions,
            // start and end dates, previous period or current period according to "past" variable
            'start-date': past ? bkPerf.getLastStart(start, end) : start,
            'end-date': past ? start : end,
            'quotaUser': session.user['user_id']
        }
    };
    if (sort !== '')
        query.qs['sort'] = sort;
    return query;
}

// translatting datas from google datas format to our own datas format
function datasFormatFunc(datas, granularity, dateFormat, n) {
    var result = [], dates = [];
    for (var i = 0; i < datas.length; i++) {
        if (granularity == 'hourly')
            dates.push(moment(datas[i][0]+datas[i][1], dateFormat).format('YYYYMMDDHHmmss'));
        else
            dates.push(moment(datas[i][0], dateFormat).format('YYYYMMDDHHmmss'));
        var res = [];
        for (var k = n; k < datas[i].length; k++) res.push(datas[i][k]);
        result.push(res);
    }
    return {dates: dates, datas: result};
}

// translatting datas from google datas format to our own datas format
function datasFormat(granularity, response) {
    var n = (granularity == 'hourly') ? 2 : 1;
    if (granularity == 'hourly') var dateFormat = 'YYYYMMDDHH';
    else if (granularity == 'daily') var dateFormat = 'YYYYMMDD';
    else if (granularity == 'weekly') var dateFormat = 'YYYYWW';
    else if (granularity == 'monthly') var dateFormat = 'YYYYMM';
    else var dateFromat = 'YYYY';

    return {
        ios: datasFormatFunc(response[0], granularity, dateFormat, n),
        android: datasFormatFunc(response[1], granularity, dateFormat, n)
    };
}

// creating a promise from a query
function promiseQuery (query) {
    var promise = new Promise(function (resolve, reject) {
        request(query, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var datas = JSON.parse(body).rows;
                resolve(datas);
            }
            else reject(error);
        });
    });
    return promise;
}

exports.query = function (codeName, metrics, dimensions, sort, start, end, granularity, past, session, client, res, limiter) {
    // the datas retrieve will have a step if the request option granularity has been set
    var hasStep = bkPerf.granularityIsSet(granularity);
    // setting dimensions of google analytics queries
    dimensions = hasStep ? bkPerf.getGranularity(granularity, 'ga') + ((dimensions === '') ? dimensions : ',' + dimensions) : dimensions;

    // setting api ios and android queries (current and past period)
    var queries = {
        'ios': {
            'past': createQuery('ios', true, client, session, metrics, dimensions, sort, start, end),
            'now': createQuery('ios', false, client, session, metrics, dimensions, sort, start, end)
        },
        'android': {
            'past': createQuery('android', true, client, session, metrics, dimensions, sort, start, end),
            'now': createQuery('android', false, client, session, metrics, dimensions, sort, start, end)
        }
    };

    // taking 4 requests if past is set (to retrieve the last period too), otherwise 2 (ios and android)
    limiter.removeTokens((past ? 4 : 2), function () {
        if (past) {
            // if past is true, the datas retrieved wont have step (granularity) and the response will have arrays of dates empty
            // if past is true, creating 4 promises (ios and android, past period and now)
            var promises = [];
            promises.push(promiseQuery(queries['ios']['now']));
            promises.push(promiseQuery(queries['ios']['past']));
            promises.push(promiseQuery(queries['android']['now']));
            promises.push(promiseQuery(queries['android']['past']));
            // executing all promises and waiting for them to be completed
            Promise.all(promises).then(function (response) {
                response[0] = (response[0] == undefined) ? 0 : response[0][0][0];
                response[1] = (response[1] == undefined) ? 0 : response[1][0][0];
                response[2] = (response[2] == undefined) ? 0 : response[2][0][0];
                response[3] = (response[3] == undefined) ? 0 : response[3][0][0];
                // setting the response
                // if there is past we format the datas retrieved without granularity
                // as explained in the documentation, the response contained ios and android datas
                // each object (ios and android) has a dates object and a datas object
                // dates will be an empty array
                // datas is an array of arrays. The first array containing the past datas, the second one containing the current datas
                var result = {
                    code: "OK",
                    codeName: codeName,
                    ios: {
                        dates: [],
                        datas: [['past', response[1]], ['now', response[0]]]
                    },
                    android: {
                        dates: [],
                        datas: [['past', response[3]], ['now', response[2]]]
                    }
                };
                res.end(JSON.stringify(result));
            }, function (error) {
                res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Impossible de récupérer les données Google Analytics.'}));
            });
        } else {
            // if past is false, creating 2 promises (ios and android)
            var promises = [];
            promises.push(promiseQuery(queries['ios']['now']));
            promises.push(promiseQuery(queries['android']['now']));
            // executing all promises and waiting for them to be completed
            Promise.all(promises).then(function (response) {
                if (hasStep) {
                    // if there is step (granularity) we format the datas retrieved with granularity
                    // as explained in the documentation, the response contained ios and android datas
                    // each object (ios and android) has a dates object and a datas object
                    // dates is an array of dates with the format YYYYMMDDHHmmss
                    // datas is an array of arrays (one array for one date, each array containing one or many datas)
                    var datas = datasFormat(granularity, response);
                    var result = {
                        code: "OK",
                        codeName: codeName,
                        ios: datas.ios,
                        android: datas.android
                    };
                }
                else {
                    var result = {
                        code: "OK",
                        codeName: codeName,
                        ios: {
                            dates: [],
                            datas: response[0]
                        },
                        android: {
                            dates: [],
                            datas: response[1]
                        }
                    };
                }
                res.end(JSON.stringify(result));
            }, function (error) {
                res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Impossible de récupérer les données Google Analytics.'}));
            });
        }
    });
};