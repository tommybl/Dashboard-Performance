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

// calculating all datas sum (ios and android)
function getDatasSum (datas) {
    var sumIos = 0, sumAnd = 0;
    for (var i = 0; i < datas.length; i++) {
        var ios = (datas[i])['ios'];
        ios = (ios == -1) ? 0 : ios;
        var android = (datas[i])['android'];
        android = (android == -1) ? 0 : android;
        sumIos += ios;
        sumAnd += android;
    }
    return {ios: sumIos, android: sumAnd};
}

// calculation one step sum (android + ios)
function getOsSum (android, ios) {
    ios = (ios == -1) ? 0 : ios;
    android = (android == -1) ? 0 : android;
    return ios + android;
}

// calculating all datas average (ios and android)
function getDatasAvg (datas) {
    var sumIos = 0, sumAnd = 0;
    for (var i = 0; i < datas.length; i++) {
        var ios = (datas[i])['ios'];
        ios = (ios == -1) ? 0 : ios / 1000;
        var android = (datas[i])['android'];
        android = (android == -1) ? 0 : android / 1000;
        sumIos += ios;
        sumAnd += android;
    }
    return {ios: sumIos / datas.length, android: sumAnd / datas.length};
}

// calculating one step average (android + ios) / 2
function getOsAvg (android, ios) {
    var nb = 2;
    if (android == -1 || ios == -1) nb = 1;
    ios = (ios == -1) ? 0 : ios / 1000;
    android = (android == -1) ? 0 : android / 1000;
    return parseInt((ios + android) / nb);
}

exports.query = function (codeName, route, type, start, end, granularity, past, avg, session, client, res, limiter) {
    // the datas retrieve will have a step if the request option granularity has been set
    var hasStep = bkPerf.granularityIsSet(granularity);
    var datasNow = [], datasPast = [], dates = [];

    // setting api queries (past and current period) (urban airship set automatically both ios and android results in the response)
    var query = {
        url: client.base + route,
        headers: {
            'Authorization': session.user['ua_authorization']
        },
        qs: {
            'start': start,
            'end': end,
            'precision': bkPerf.getGranularity(granularity, 'ua')
        }
    };
    var queryPast = {
        url: client.base + route,
        headers: {
            'Authorization': session.user['ua_authorization']
        },
        qs: {
            'start': bkPerf.getLastStart(start, end),
            'end': start,
            'precision': bkPerf.getGranularity(granularity, 'ua')
        }
    };
    // if the query has no step, we set the ganularity to 'DAILY' so we always have the same calcul rules to calculate the total for one period
    // explained below
    if (!hasStep) {
        query.qs['precision'] = 'DAILY';
        queryPast.qs['precision'] = 'DAILY';
    }

    function errorCallback (error) {
        res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Impossible de récupérer les données Urban Airship.'}));
    }

    // urban airship send all his datas by pages (their his no other way) with a limit of datas by pages (not big)
    // plus it doesnt accept queries without granularities, so it always sends datas with steps
    // if we want the total for the period without the steps, we have to calculate ourselves
    // so to retrieve all the datas for one period we have no other way but to query all the pages until the last one and cumulate datas of each page in arrays

    // callback used if "past" is true so we get the datas for the previous period too
    function pastCallback (response) {
        // if the datas retrieved has still a next page we cumulate the datas in arrays (current period array and past period array)
        // then we query the next page
        if ((response[0])['next_page'] != undefined) {
            var promises = [];
            datasNow = datasNow.concat((response[0])[type]);
            datasPast = datasPast.concat((response[1])[type]);
            query.url = (response[0])['next_page'];
            query.qs = {};
            queryPast.url = (response[1])['next_page'];
            queryPast.qs = {};
            // creating 2 promises (past period and now)
            promises.push(promiseQuery(query));
            promises.push(promiseQuery(queryPast));
            // executing all promises and waiting for them to be completed
            limiter.removeTokens(2, function () {
                Promise.all(promises).then(pastCallback, errorCallback);
            });
        }
        // if the datas retrieved are on the last page we format all the datas cumulated in the arrays and put them in the response
        else {
            datasNow = datasNow.concat((response[0])[type]);
            datasPast = datasPast.concat((response[1])[type]);
            // we calculate the total or the average for each period (there is no granularity)
            datasNow = avg ? getDatasAvg(datasNow) : getDatasSum(datasNow);
            datasPast = avg ? getDatasAvg(datasPast) : getDatasSum(datasPast);
            var result = {
                code: "OK",
                codeName: codeName,
                ios: {
                    dates: [],
                    datas: [['past', datasPast.ios], ['now', datasNow.ios]]
                },
                android: {
                    dates: [],
                    datas: [['past', datasPast.android], ['now', datasNow.android]]
                }
            };
            res.end(JSON.stringify(result));
        }
    }

    // callback used if "past" is false so we only get the datas for the current period
    function nowCallback (error, response, body) {
        if (!error && response.statusCode == 200) {
            var datas = JSON.parse(body);
            // if the datas retrieved has still a next page we cumulate the datas in arrays (only current period array)
            // then we query the next page
            if (datas['next_page'] != undefined) {
                datasNow = datasNow.concat(datas[type]);
                query.url = datas['next_page'];
                query.qs = {};
                limiter.removeTokens(1, function () {
                    request(query, nowCallback);
                });
            }
            // if the datas retrieved are on the last page we format all the datas cumulated in the arrays and put them in the response
            else {
                datasNow = datasNow.concat(datas[type]);
                if (!hasStep) {
                    datas = getDatasSum(datasNow);
                    var result = 
                    {
                        code: "OK",
                        codeName: codeName,
                        ios: {
                            dates: [],
                            datas: [[datas.ios]]
                        },
                        android: {
                            dates: [],
                            datas: [[datas.android]]
                        }
                    };
                }
                // if there are steps (granularity) we format datas
                // translatting datas from urban airship datas format to our own datas format
                else {
                    datas = datasNow;
                    var datasIos = [], datasAnd = [], ios = 0, android = 0;
                    for (var i = 0; i < datas.length; i++) {
                        dates.push(moment((datas[i])['date'], 'YYYY-MM-DD HH:mm:ss').format('YYYYMMDDHHmmss'));
                        ios = (datas[i])['ios'];
                        android = (datas[i])['android'];
                        if (avg) {
                            datasIos.push([((ios == -1) ? 0 : ios) / 1000]);
                            datasAnd.push([((android == -1) ? 0 : android) / 1000]);
                        }
                        else {
                            datasIos.push([(ios == -1) ? 0 : ios]);
                            datasAnd.push([(android == -1) ? 0 : android]);
                        }
                    }
                    var result = {
                        code: "OK",
                        codeName: codeName,
                        ios: {
                            dates: dates,
                            datas: datasIos
                        },
                        android: {
                            dates: dates,
                            datas: datasAnd
                        }
                    };
                }
                res.end(JSON.stringify(result));
            }
        }
        else {errorCallback(error);}
    }

    if (past) {
        var promises = [];
        promises.push(promiseQuery(query));
        promises.push(promiseQuery(queryPast));
        limiter.removeTokens(2, function () {
            Promise.all(promises).then(pastCallback, errorCallback);
        });
    }
    else {
        limiter.removeTokens(1, function () {
            request(query, nowCallback);
        });
    }
};