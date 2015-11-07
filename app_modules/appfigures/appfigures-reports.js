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
function datasFormat(datas, type) {
    var dates = [], res = [];
    Object.keys(datas).forEach(function(key) {
        dates.push(moment(key, 'YYYY-MM-DD').format('YYYYMMDDHHmmss'));
        res.push([datas[key][type]]);
    });
    return {dates: dates, datas: res};
}

exports.query = function (codeName, route, type, all, start, end, granularity, past, session, client, res, limiter) {
    // the datas retrieve will have a step if the request option granularity has been set
    var hasStep = bkPerf.granularityIsSet(granularity);

    // setting api queries (past and current period) (with appfigures we can retrieve datas from 2 products at once)
    var query = {
        url: client.base + route,
        headers: {
            'X-Client-Key': client.clientKey,
            'Authorization': session.user['af_authorization']},
        qs: {
            'products': session.user['af_ios'] + ';' + session.user['af_android'],
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
            'group_by': 'product'
        }
    };
    // if we dont want to retrieve the total for all times (a number)
    if (!all) {
        // setting start and end dates for past and current period
        query.qs['start_date'] = start;
        query.qs['end_date'] = end;
        queryPast.qs['start_date'] = bkPerf.getLastStart(start, end);
        queryPast.qs['end_date'] = start;
        // if there is step, we group data by dates and we set the granularity
        if (hasStep) {
            query.qs['group_by'] += ',date';
            query.qs['granularity'] = bkPerf.getGranularity(granularity, 'af');
        }
    }

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
                // datas is an array of arrays. The first array containing the past datas, the second one containing the current datas
                var result = {
                    code: "OK",
                    codeName: codeName,
                    ios: {
                        dates: [],
                        datas: [['past', response[1][session.user['af_ios']+''][type]], ['now', response[0][session.user['af_ios']+''][type]]]
                    },
                    android: {
                        dates: [],
                        datas: [['past', response[1][session.user['af_android']+''][type]], ['now', response[0][session.user['af_android']+''][type]]]
                    }
                }
                res.end(JSON.stringify(result));
            }, function (error) {
                res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Impossible de récupérer les données App Figures.'}));
            });
        }
        else {
            // if past is false, creating 1 request
            request(query, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var datas = JSON.parse(body);
                    if (!hasStep) {
                        var result = {
                            code: "OK",
                            codeName: codeName,
                            ios: {
                                dates: [],
                                datas: [[datas[session.user['af_ios']+''][type]]]
                            },
                            android: {
                                dates: [],
                                datas: [[datas[session.user['af_android']+''][type]]]
                            }
                        };
                    }
                    else {
                        // if there is step (granularity) we format the datas retrieved with granularity
                        // as explained in the documentation, the response contained ios and android datas
                        // each object (ios and android) has a dates object and a datas object
                        // dates is an array of dates with the format YYYYMMDDHHmmss
                        // datas is an array of arrays (one array for one date, each array containing one or many datas)
                        var result = {
                            code: "OK",
                            codeName: codeName,
                            ios: datasFormat(datas[session.user['af_ios']+''], type),
                            android: datasFormat(datas[session.user['af_android']+''], type)
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