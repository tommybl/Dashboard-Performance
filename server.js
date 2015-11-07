// getting required modules
var express = require('express');
var https = require('https');
var mysql = require('mysql');
var pem = require('pem');
var session = require('express-session');
var MemoryStore = session.MemoryStore;
var compress = require('compression');
var bodyParser = require('body-parser');
var moment = require('moment');
var request = require('request');
var fs = require('fs');
var RateLimiter = require('limiter').RateLimiter;
var bkPerf = require('./app_modules/bkPerf');
// google analytics module
var ga = require('./app_modules/google/googleanalytics');
// app figures modules
var af = {
    reports: require('./app_modules/appfigures/appfigures-reports'),
    ranks: require('./app_modules/appfigures/appfigures-ranks'),
    ratings: require('./app_modules/appfigures/appfigures-ratings'),
    reviews: require('./app_modules/appfigures/appfigures-reviews')
};
// urban airship modules
var ua = {
    global: require('./app_modules/urbanairship/urbanairship-global'),
    responses: require('./app_modules/urbanairship/urbanairship-responses'),
    listing: require('./app_modules/urbanairship/urbanairship-listing')
};

// creating a new session store
var sessionStore = new MemoryStore();

// creating a new mysql pool for future database requests
var pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'bkperfdashboard',
    connectionLimit: 1000
});

// settings for google, app figures and urban airship clients
var clients = {
    ga: {
        clientKey: 'INSERT-CONFIDENTIAL',
        clientSecret: 'INSERT-CONFIDENTIAL',
        callbackURL: 'http://localhost:1337/google/oauth2/callback',
        base: 'https://www.googleapis.com/analytics/v3/data/ga',
        scope: 'email https://www.googleapis.com/auth/analytics.readonly'
    },
    af: {
        clientKey: 'INSERT-CONFIDENTIAL',
        clientSecret: 'INSERT-CONFIDENTIAL',
        authorization: 'Basic ' + bkPerf.StringToBase64('INSERT-CONFIDENTIAL:INSERT-CONFIDENTIAL'),
        callbackURL: 'http://localhost:1337/appfigures/oauth1/callback',
        base: 'https://api.appfigures.com/v2/',
        scope: 'products:read,private:read,account:read,public:read'
    },
    ua: {
        authorization: 'Basic ' + bkPerf.StringToBase64('INSERT-CONFIDENTIAL:INSERT-CONFIDENTIAL'),
        base: 'https://go.urbanairship.com/api/'
    }
};

// creating a new app with express framework
var app = express();

// object containing the limiters to filter and control requests (for exemple 10 requests max per second to google apis)
var queryLimiters = {};
var refreshTokens = {};

app.set('view engine', 'ejs');
app.enable('trust proxy');
//app.set('trust proxy', false);

// needed to compress all our responses
app.use(compress());
// needed to parse requests body (for example in post requests)
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// needed to manage sessions
app.use(session({store: sessionStore, secret: 'keyboard cat', resave: true, saveUninitialized: true, cookie: { path: '/', httpOnly: true, secure: false, maxAge: 365*24*60*60*1000}}));

app

// route to log in the app
.post('/login', function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    //verifying in database that login informations are correct
    pool.getConnection(function (err, connection) {
        if (err) res.redirect('/?login=error');
        else {
            var query = 'SELECT * FROM user INNER JOIN account ON user.id_account = account.id WHERE STRCMP(user.email, \'' + email + '\') = 0 AND STRCMP(user.password, \'' + password + '\') = 0';
            connection.query(query , function (err, rows) {
                if (err) res.redirect('/?login=error');
                // if the login informations are correct we create the user in session
                else if (rows.length) {
                    // retrieving user and his linked account informations
                    req.session.user = {};
                    req.session.user['email'] = email;
                    req.session.user['user_id'] = rows[0]['id'];
                    req.session.user['type'] = rows[0]['type'];
                    req.session.user['account'] = rows[0]['name'];
                    req.session.user['account_id'] = rows[0]['id_account'];
                    req.session.user['ga_token'] = rows[0]['ga_token'];
                    req.session.user['ga_refresh'] = rows[0]['ga_refresh'];
                    req.session.user['ga_ios'] = rows[0]['ga_ios'];
                    req.session.user['ga_android'] = rows[0]['ga_android'];
                    req.session.user['af_has_account'] = rows[0]['af_has_account'];
                    req.session.user['af_token'] = rows[0]['af_token'];
                    req.session.user['af_token_secret'] = rows[0]['af_token_secret'];
                    req.session.user['af_ios'] = rows[0]['af_ios'];
                    req.session.user['af_android'] = rows[0]['af_android'];
                    req.session.user['ua_key'] = rows[0]['ua_key'];
                    req.session.user['ua_master'] = rows[0]['ua_master'];
                    // setting google analytics authorization header for futur api calls
                    if (req.session.user['ga_token'] != undefined)
                        req.session.user['ga_authorization'] = 'Bearer ' + req.session.user['ga_token'];
                    // if client account doesnt have its own app figures account, setting app figures authorization header with backelite account
                    if (!req.session.user['af_has_account'])
                        req.session.user['af_authorization'] = clients.af.authorization;
                    // otherwise setting app figures authorization header with client account for futur api calls
                    if (req.session.user['af_token'] != undefined && req.session.user['af_token_secret'] != undefined)
                        req.session.user['af_authorization'] = 'OAuth oauth_signature_method=PLAINTEXT, ' +
                                                               'oauth_consumer_key=' + clients.af.clientKey + ', ' +
                                                               'oauth_token=' + req.session.user['af_token'] + ', ' +
                                                               'oauth_signature=' + clients.af.clientSecret + '&' + req.session.user['af_token_secret'];
                    // setting urban airship authorization header for futur api calls
                    if (req.session.user['ua_key'] != undefined && req.session.user['ua_master'] != undefined)
                        req.session.user['ua_authorization'] = 'Basic ' + bkPerf.StringToBase64(req.session.user['ua_key'] + ':' + req.session.user['ua_master']);
                    // setting connectors query limiters to user if i doesnt already exists
                    if (queryLimiters[req.session.user['user_id']+''] == undefined) {
                        queryLimiters[req.session.user['user_id']+''] = {};
                        // limiting google analytics requests to 7 every 1.25 sec, other requests are pending until they can be executed
                        queryLimiters[req.session.user['user_id']+'']['ga'] = new RateLimiter(7, 1250);
                        queryLimiters[req.session.user['user_id']+'']['af'] = new RateLimiter(50, 1000);
                        queryLimiters[req.session.user['user_id']+'']['ua'] = new RateLimiter(50, 1000);
                    }
                    // clearing google refreshing token interval if it already exists
                    if (refreshTokens[req.session.user['user_id']+''] != undefined) {
                        console.log("clear google token refreshing interval");
                        clearInterval(refreshTokens[req.session.user['user_id']+'']);
                    }
                    // creating new google refreshing token interval of 50min
                    if (req.session.user['ga_refresh'] != undefined) {
                        var interv = setInterval(function () {
                            bkPerf.refreshGoogleToken(req.session, pool, clients.ga);
                        }, 3000000);
                        refreshTokens[req.session.user['user_id']+''] = interv;
                        bkPerf.refreshGoogleToken(req.session, pool, clients.ga, res);
                        // redirecting to index
                    } else res.redirect('/');
                }
                // if they are not correct, redirection to login page with an error message
                else res.redirect('/?login=unauthorized');
                // releasing connection with database
                connection.release();
            });
        }
    });
})

// route to get login page
.get('/login', function (req, res) {
    // retrieving user session from session id
    /*var sessID = req.sessionID;
    sessionStore.get(sessID, function (err, sess) {
        console.log(sess);
    });*/
    res.setHeader("Content-Type", "text/html");
    res.render('partials/login', {login: req.query.login});
})

// route to configure urban airship connector
.post('/configuration/urbanairship', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined || req.session.user.type != 'client') {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    var query = {
        url: clients.ua.base + 'reports/devices',
        headers: {'Authorization': 'Basic ' + bkPerf.StringToBase64(req.body['ua_key'] + ':' + req.body['ua_master'])}
    };
    // requesting urban airship api with app key and app master provided to verify that the account exists
    request(query, function (error, response, body) {
        // if the account exists we save the client account configuration in database
        if (response.statusCode == 200) {
            pool.getConnection(function (err, connection) {
                if (err) res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Une erreur est survenue. Veuillez réessayer.'}));
                else {
                    var query = 'UPDATE account SET ua_key = \'' + req.body['ua_key'] + '\', ua_master = \'' + req.body['ua_master'] + '\' WHERE ID = ' + req.session.user['account_id'];
                    connection.query(query , function (err, rows) {
                        if (err) res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'}));
                        else {
                            // if configuration is successfully saved in database we set it in the session, and set urban airship authorization header for futur api calls
                            req.session.user['ua_key'] = req.body['ua_key'];
                            req.session.user['ua_master'] = req.body['ua_master'];
                            req.session.user['ua_authorization'] = 'Basic ' + bkPerf.StringToBase64(req.session.user['ua_key'] + ':' + req.session.user['ua_master']);
                            res.end(JSON.stringify({code: 'OK', status: 200, message: 'Configuration Urban Aurship sauvegardée.'}));
                        }
                        connection.release();
                    });
                }
            });
        }
        else if (response.statusCode == 401)
            res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'App key ou master secret invalide. Veuillez réessayer.'}));
        else
            res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Une erreur est survenue. Veuillez réessayer.'}));
    });
})

// route to configure google analytics connector
.post('/configuration/google', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined  || req.session.user.type != 'client') {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    // saving the client account configuration in database
    pool.getConnection(function (err, connection) {
        if (err) res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Une erreur est survenue. Veuillez réessayer.'}));
        else {
            var query = 'UPDATE account SET ga_ios = \'' + req.body['ga_ios'] + '\', ga_android = \'' + req.body['ga_android'] + '\', ga_token = \'' + req.session.user['ga_token'] + '\', ga_refresh = \'' + req.session.user['ga_refresh'] + '\' WHERE ID = ' + req.session.user['account_id'];
            connection.query(query , function (err, rows) {
                if (err) res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Une erreur est survenue. Veuillez réessayer.'}));
                else {
                    // if configuration is successfully saved in database we set it in the session, and set google analytics authorization header for futur api calls
                    req.session.user['ga_ios'] = req.body['ga_ios'];
                    req.session.user['ga_android'] = req.body['ga_android'];
                    // clearing google refreshing token interval if it already exists
                    if (refreshTokens[req.session.user['user_id']+''] != undefined)
                        clearInterval(refreshTokens[req.session.user['user_id']+'']);
                    // creating new google refreshing token interval of 50min
                    var interv = setInterval(function () {
                        bkPerf.refreshGoogleToken(req.session, pool, clients.ga);
                    }, 3000000);
                    refreshTokens[req.session.user['user_id']+''] = interv;
                    res.end(JSON.stringify({code: 'OK', status: 200, message: 'Configuration Google Analytics sauvegardée.'}));
                }
                connection.release();
            });
        }
    });
})

// route to configure app figures connector
.post('/configuration/appfigures', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined || req.session.user.type != 'client' || req.session.user['af_has_account'] == 0) {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    // saving the client account configuration in database
    pool.getConnection(function (err, connection) {
        if (err) res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Une erreur est survenue. Veuillez réessayer.'}));
        else {
            var query = 'UPDATE account SET af_ios = \'' + req.body['af_ios'] + '\', af_android = \'' + req.body['af_android'] + '\', af_token = \'' + req.session.user['af_token'] + '\', af_token_secret = \'' + req.session.user['af_token_secret'] + '\' WHERE ID = ' + req.session.user['account_id'];
            connection.query(query , function (err, rows) {
                if (err) res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Une erreur est survenue. Veuillez réessayer.'}));
                else {
                    // if configuration is successfully saved in database we set it in the session, and set app figures authorization header for futur api calls
                    req.session.user['af_ios'] = req.body['af_ios'];
                    req.session.user['af_android'] = req.body['af_android'];
                    res.end(JSON.stringify({code: 'OK', status: 200, message: 'Configuration App Figures sauvegardée.'}));
                }
                connection.release();
            });
        }
    });
})

// route to log out of the app account
.get('/logout', function (req, res) {
    if (req.session.user == undefined) {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    // destroying session
    req.session.destroy();
    res.redirect('/');
})

// route to log out of google analytics to modify configuration
.get('/google/logout', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined || req.session.user.type != 'client') {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    // deleting google analytics configuration from client account in database
    pool.getConnection(function (err, connection) {
        if (err) res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Une erreur est survenue. Veuillez réessayer.'}));
        else {
            var query = 'UPDATE account SET ga_ios = NULL, ga_android = NULL, ga_token = NULL, ga_refresh = NULL WHERE ID = ' + req.session.user['account_id'];
            connection.query(query , function (err, rows) {
                if (err) res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Une erreur est survenue. Veuillez réessayer.'}));
                else {
                    // clearing google refreshing token interval if it already exists
                    if (refreshTokens[req.session.user['user_id']+''] != undefined)
                        clearInterval(refreshTokens[req.session.user['user_id']+'']);
                    // if configuration is successfully deleted, clearing configuration from session
                    req.session.user['ga_token'] = undefined;
                    req.session.user['ga_refresh'] = undefined;
                    req.session.user['ga_ios'] = undefined;
                    req.session.user['ga_android'] = undefined;
                    req.session.user['ga_authorization'] = undefined;
                    res.end(JSON.stringify({code: 'OK', status: 200, message: 'Configuration Google Analytics effacée.'}));
                }
                connection.release();
            });
        }
    });
})

// route to start google oauth2 procedure, asking a request token
.get('/google/oauth2/request', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined || req.session.user.type != 'client') {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    var options = {
        url: 'https://accounts.google.com/o/oauth2/auth',
        qs: {
            'scope': clients.ga.scope,
            'state': req.session['quotaUserId'],
            'redirect_uri': clients.ga.callbackURL,
            'response_type': 'code',
            'client_id': clients.ga.clientKey,
            'access_type': 'offline',
            'approval_prompt': 'force'
        }
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200)
            // responding with an url for the user to authentify in google
            res.end(JSON.stringify({code: 'OK', status: 200, message: response.request.uri.href}));
        else res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'La demande de request token google analytics a échouée.'}));
    });
})

// google oauth2 procedure callback, to get a verifier needed to get an access token, after the user is successfully authentified
.get('/google/oauth2/callback', function (req, res) {
    res.setHeader("Content-Type", "text/html");
    if (req.session.user == undefined || req.session.user.type != 'client') {res.sendFile('app/partials/unauthorized.html', { root: __dirname }); return;}
    // saving verifier that will be used to get an access token
    req.session.user['ga_verifier'] = req.query['code'];
    res.render('google-oauth-callback');
})

// google oauth2 procedure, asking an access token for the user authentified
.get('/google/oauth2/access', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined || req.session.user.type != 'client') {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    var options = {
        url: 'https://www.googleapis.com/oauth2/v3/token',
        form: {
            'code': req.session.user['ga_verifier'],
            'client_id': clients.ga.clientKey,
            'client_secret': clients.ga.clientSecret,
            'redirect_uri': clients.ga.callbackURL,
            'grant_type': 'authorization_code'
        }
    };
    request.post(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // if the response if successful, we save the access token and set the google analytics authorization header for futur api calls
            body = JSON.parse(body);
            req.session.user['ga_token'] = body['access_token'];
            req.session.user['ga_refresh'] = body['refresh_token'];
            req.session.user['ga_authorization'] = 'Bearer ' + body['access_token'];
            res.end(JSON.stringify({code: 'OK', status: 200, message: 'Connexion à Google réussie.'}));
        }
        else res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'La demande d\'access token Google a échouée.'}));
    });
})

// route to get the email of the google account used by the user of the dashboard
.get('/google/get/email', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined || req.session.user.type == 'admin') {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    if (req.session.user['ga_authorization'] == undefined) {
        res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Vous n\'êtes pas connecté à Google Analytics.'}));
        return;
    }
    var options = {
        url: 'https://www.googleapis.com/oauth2/v2/userinfo',
        headers: {'Authorization': req.session.user['ga_authorization']}};
    queryLimiters[req.session.user['user_id']+'']['ga'].removeTokens(1, function () {
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            body = JSON.parse(body);
            res.end(JSON.stringify({code: 'OK', status: 200, message: body.email}));
        }
        else res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'La récupération du mail du compte Google Analytics a échouée.'}));
    }); });
})

// route to get all the products of the google account used in the configuration by the user of the dashboard
.get('/google/get/products', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined || req.session.user.type == 'admin') {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    if (req.session.user['ga_authorization'] == undefined) {
        res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Vous n\'êtes pas connecté à Google Analytics.'}));
        return;
    }
    var options = {
        url: 'https://www.googleapis.com/analytics/v3/management/accountSummaries',
        headers: {'Authorization': req.session.user['ga_authorization']}};
    queryLimiters[req.session.user['user_id']+'']['ga'].removeTokens(1, function () {
    request(options, function (error, response, body) {
        body = JSON.parse(body);
        // we respond with all the google analytics accounts found in the user google account
        if (!error && response.statusCode == 200) res.end(JSON.stringify(body.items));
        else res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'La récupération des produits du compte Google Analytics a échouée.'}));
    }); });
})

// route to get the products (ios and android) of the google account used in the configuration by the user of the dashboard
.get('/google/get/accounts', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined || req.session.user.type == 'admin') {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    if (req.session.user['ga_authorization'] == undefined) {
        res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Vous n\'êtes pas connecté à Google Analytics.'}));
        return;
    }
    var options = {
        url: 'https://www.googleapis.com/analytics/v3/management/accountSummaries',
        headers: {'Authorization': req.session.user['ga_authorization']}};
    queryLimiters[req.session.user['user_id']+'']['ga'].removeTokens(1, function () {
    request(options, function (error, response, body) {
        // we respond with all the google analytics accounts found in the user google account, that will be filtrated client side using ios and android accounts ids
        body = JSON.parse(body);
        body = {
            'ios': req.session.user['ga_ios'],
            'android': req.session.user['ga_android'],
            'items': body.items
        };
        if (!error && response.statusCode == 200) res.end(JSON.stringify(body));
        else res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'La récupération des comptes du compte Google Analytics a échouée.'}));
    }); });
})

// route to log out of google analytics to modify configuration
.get('/appfigures/logout', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined || req.session.user.type != 'client' || req.session.user['af_has_account'] == 0) {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    // deleting app figures configuration from client account in database
    pool.getConnection(function (err, connection) {
        if (err) res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Une erreur est survenue. Veuillez réessayer.'}));
        else {
            var query = 'UPDATE account SET af_ios = NULL, af_android = NULL, af_token = NULL, af_token_secret = NULL WHERE ID = ' + req.session.user['account_id'];
            connection.query(query , function (err, rows) {
                if (err) res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Une erreur est survenue. Veuillez réessayer.'}));
                else {
                    // if configuration is successfully deleted, clearing configuration from session
                    req.session.user['af_token'] = undefined;
                    req.session.user['af_token_secret'] = undefined;
                    req.session.user['af_ios'] = undefined;
                    req.session.user['af_android'] = undefined;
                    req.session.user['af_authorization'] = undefined;
                    res.end(JSON.stringify({code: 'OK', status: 200, message: 'Configuration App Figures effacée.'}));
                }
                connection.release();
            });
        }
    });
})

// route to start app figures oauth1 procedure, asking a request token
.get('/appfigures/oauth1/request', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined || req.session.user.type != 'client' || req.session.user['af_has_account'] == 0) {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    var options = {
        url: clients.af.base + 'oauth/request_token',
        headers: {
            'Authorization': 'OAuth oauth_signature_method=PLAINTEXT, ' +
                             'oauth_callback=' + clients.af.callbackURL + ', ' +
                             'oauth_consumer_key=' + clients.af.clientKey + ', ' +
                             'oauth_signature=' + clients.af.clientSecret + '&',
            'X-OAuth-Scope': clients.af.scope
        }
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var codes = body.split('&');
            req.session.user['af_token'] = codes[1].replace('oauth_token=', '');
            req.session.user['af_token_secret'] = codes[2].replace('oauth_token_secret=', '');
            // responding with an url for the user to authentify in app figures
            res.end(JSON.stringify({code: 'OK', status: 200, message: clients.af.base + 'oauth/authorize?oauth_token=' + req.session.user['af_token']}));
        }
        else res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'La demande de request token app figures a échouée.'}));
    });
})

// app figures oauth1 procedure callback, to get a verifier needed to get an access token, after the user is successfully authentified
.get('/appfigures/oauth1/callback', function (req, res) {
    res.setHeader("Content-Type", "text/html");
    if (req.session.user == undefined || req.session.user.type != 'client' || req.session.user['af_has_account'] == 0) {res.sendFile('app/partials/unauthorized.html', { root: __dirname }); return;}
    req.session.user['af_token'] = req.query['oauth_token'];
    // saving verifier that will be used to get an access token
    req.session.user['af_verifier'] = req.query['oauth_verifier'];
    res.render('appfigures-oauth-callback');
})

// app figures oauth1 procedure, asking an access token for the user authentified
.get('/appfigures/oauth1/access', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined && req.session.user.type != 'client') {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    var options = {
        url: clients.af.base + 'oauth/access_token',
        headers: {
            'Authorization': 'OAuth oauth_signature_method=PLAINTEXT, ' +
                             'oauth_verifier=' + req.session.user['af_verifier'] + ', ' +
                             'oauth_consumer_key=' + clients.af.clientKey + ', ' +
                             'oauth_token=' + req.session.user['af_token'] + ', ' +
                             'oauth_signature=' + clients.af.clientSecret + '&' + req.session.user['af_token_secret']
        }
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            // if the response if successful, we save the access token and set the app figures authorization header for futur api calls
            var codes = body.split('&');
            req.session.user['af_token'] = codes[0].replace('oauth_token=', '');
            req.session.user['af_token_secret'] = codes[1].replace('oauth_token_secret=', '');
            req.session.user['af_authorization'] = 'OAuth oauth_signature_method=PLAINTEXT, ' +
                                                   'oauth_consumer_key=' + clients.af.clientKey + ', ' +
                                                   'oauth_token=' + req.session.user['af_token'] + ', ' +
                                                   'oauth_signature=' + clients.af.clientSecret + '&' + req.session.user['af_token_secret'];
            res.end(JSON.stringify({code: 'OK', status: 200, message: 'Connexion à App Figures réussie.'}));
        }
        else res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'La demande d\'access token App Figures a échouée.'}));
    });
})

// route to get the email of the app figures account used by the user of the dashboard
.get('/appfigures/get/email', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined || req.session.user.type == 'admin') {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    if (req.session.user['af_authorization'] == undefined) {
        res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Vous n\'êtes pas connecté App Figures'}));
        return;
    }
    var options = {
        url: clients.af.base,
        headers: {
            'X-Client-Key': clients.af.clientKey,
            'Authorization': req.session.user['af_authorization']}
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var elt = JSON.parse(body);
            res.end(JSON.stringify({code: 'OK', status: 200, message: elt.user.email}));
        }
        else res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'La récupération du mail du compte App Figures a echouée.'}));
    });
})

// route to get all the products of the app figures account used in the configuration by the user of the dashboard
.get('/appfigures/get/products', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined) {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    if (req.session.user['af_authorization'] == undefined) {
        res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Vous n\'êtes pas connecté App Figures'}));
        return;
    }
    var options = {
        url: clients.af.base + 'products/mine',
        headers: {
            'X-Client-Key': clients.af.clientKey,
            'Authorization': req.session.user['af_authorization']}
    };
    request(options, function (error, response, body) {
        // we respond with all the app figures products found in the user google account
        if (!error && response.statusCode == 200) res.end(body);
        else res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'La récupération des produits du compte App Figures a echouée.'}));
    });
})

// route to get all the ios product of the app figures account used in the configuration by the user of the dashboard
.get('/appfigures/get/products/ios', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined || req.session.user.type == 'admin') {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    if (req.session.user['af_authorization'] != undefined) {
        var options = {
            url: clients.af.base + 'products/' + req.session.user['af_ios'],
            headers: {
            'X-Client-Key': clients.af.clientKey,
            'Authorization': req.session.user['af_authorization']}
        };
        request(options, function (error, response, body) {
            // we respond with the ios product only
            if (!error && response.statusCode == 200) res.end(body);
            else res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'La récupération des produits du compte App Figures a echouée.'}));
        });
    }
    else res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Vous n\'êtes pas connecté App Figures'}));
})

// route to get all the android product of the app figures account used in the configuration by the user of the dashboard
.get('/appfigures/get/products/android', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined || req.session.user.type == 'admin') {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    if (req.session.user['af_authorization'] != undefined) {
        var options = {
            url: clients.af.base + 'products/' + req.session.user['af_android'],
            headers: {
            'X-Client-Key': clients.af.clientKey,
            'Authorization': req.session.user['af_authorization']}
        };
        request(options, function (error, response, body) {
            // we respond with the android product only
            if (!error && response.statusCode == 200) res.end(body);
            else res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'La récupération des produits du compte App Figures a echouée.'}));
        });
    }
    else res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Vous n\'êtes pas connecté App Figures'}));
})

// route to log out of urban airship to modify configuration
.get('/urbanairship/logout', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined || req.session.user.type != 'client') {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    // deleting urban airship configuration from client account in database
    pool.getConnection(function (err, connection) {
        if (err) res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Une erreur est survenue. Veuillez réessayer.'}));
        else {
            var query = 'UPDATE account SET ua_key = NULL, ua_master = NULL WHERE ID = ' + req.session.user['account_id'];
            connection.query(query , function (err, rows) {
                if (err) res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Une erreur est survenue. Veuillez réessayer.'}));
                else {
                    // if configuration is successfully deleted, clearing configuration from session
                    req.session.user['ua_key'] = undefined;
                    req.session.user['ua_master'] = undefined;
                    req.session.user['ua_authorization'] = undefined;
                    res.end(JSON.stringify({code: 'OK', status: 200, message: 'Configuration Urban Airship effacée.'}));
                }
                connection.release();
            });
        }
    });
})

// route for an admin to add a new client account
.post('/admin/add/account', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined || req.session.user.type != 'admin') {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    pool.getConnection(function (err, connection) {
        if (err) res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Une erreur est survenue. Veuillez réessayer.'}));
        else {
            if (req.body['account_has'] == 0)
                var query = 'INSERT INTO account (name, af_has_account, af_ios, af_android) VALUES (\'' + req.body['account_name'] + '\', \'' + req.body['account_has'] + '\', \'' + req.body['af_ios'] + '\', \'' + req.body['af_android'] + '\')';
            else var query = 'INSERT INTO account (name, af_has_account) VALUES (\'' + req.body['account_name'] + '\', \'' + req.body['account_has'] + '\')';
            connection.query(query , function (err, rows) {
                if (err) res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Une erreur est survenue. Veuillez réessayer.'}));
                else res.end(JSON.stringify({code: 'OK', status: 200, message: 'Nouveau compte client ajouté avec succès.'}));
                connection.release();
            });
        }
    });
})

// route for an admin to add a new user
.post('/admin/add/user', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined || req.session.user.type != 'admin') {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    pool.getConnection(function (err, connection) {
        if (err) res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Une erreur est survenue. Veuillez réessayer plus tard.'}));
        else {
            var query = 'SELECT * FROM user WHERE STRCMP(user.email, \'' + req.body['user_mail'] + '\') = 0';
            connection.query(query , function (err, rows) {
                if (err) res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Une erreur est survenue. Veuillez réessayer plus tard.'}));
                else if (rows.length) {
                    res.end(JSON.stringify({code: 'FAIL', status: 409, message: 'Adresse email déjà utilisée pour un autre compte.'}));
                }
                else {
                    var query = 'INSERT INTO user (type, email, password, id_account) VALUES (\'' + req.body['user_type'] + '\', \'' + req.body['user_mail'] + '\', \'' + req.body['user_psw'] + '\', \'' + req.body['user_account'] + '\')';
                    connection.query(query , function (err, rows) {
                        if (err) res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Une erreur est survenue. Veuillez réessayer plus tard.'}));
                        else {
                            res.end(JSON.stringify({code: 'OK', status: 200, message: 'Nouvel utilisateur ajouté avec succès.'}));
                        }
                    });
                }
                connection.release();
            });
        }
    });
})

// route for an admin to get all the client accounts
.get('/admin/get/accounts', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined || req.session.user.type != 'admin') {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    pool.getConnection(function (err, connection) {
        if (err) res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Une erreur est survenue. Veuillez réessayer.'}));
        else {
            var query = 'SELECT * FROM account';
            connection.query(query , function (err, rows) {
                if (err) res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Une erreur est survenue. Veuillez réessayer.'}));
                else if (rows.length) {
                    // formatting the data to send
                    var datas = [];
                    for (var k = 0; k < rows.length; k++)
                        datas.push([rows[k]['id'], rows[k]['name'], (rows[k]['af_has_account'] == 1) ? 'client' : 'backelite', (rows[k]['ga_token'] == undefined) ? 'attente' : 'configuré', (rows[k]['af_token'] == undefined) ? 'attente' : 'configuré', (rows[k]['ua_key'] == undefined) ? 'attente' : 'configuré']);
                    res.end(JSON.stringify({code: 'OK', status: 200, datas: datas}));
                }
                connection.release();
            });
        }
    });
})

// route for an admin to get all users
.get('/admin/get/users', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    if (req.session.user == undefined || req.session.user.type != 'admin') {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    pool.getConnection(function (err, connection) {
        if (err) res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Une erreur est survenue. Veuillez réessayer.'}));
        else {
            var query = 'SELECT * FROM user INNER JOIN account ON user.id_account = account.id';
            connection.query(query , function (err, rows) {
                if (err) res.end(JSON.stringify({code: 'FAIL', status: 500, message: 'Une erreur est survenue. Veuillez réessayer.'}));
                else if (rows.length) {
                    // formatting the data to send
                    var datas = [];
                    for (var k = 0; k < rows.length; k++) datas.push([rows[k]['email'], rows[k]['type'], rows[k]['name']]);
                    res.end(JSON.stringify({code: 'OK', status: 200, datas: datas}));
                }
                connection.release();
            });
        }
    });
})

// route for a user to request indicators to the api
.get('/get/api/data', function (req, res) {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Accept', 'application/json');
    
    if (req.session.user == undefined || req.session.user.type == 'admin') {res.end(JSON.stringify({code: 'FAIL', status: 401, message: 'Non autorisé. Connectez vous.'})); return;}
    // request options
    var codeName = req.query.codeName; // code name of the indicator asked
    var start = req.query.start; // start date of the period to retrieve
    var end = req.query.end; // end date of the period to retrieve
    var granularity = req.query.granularity; // granularity of the period to retrieve
    var past = (req.query.past == undefined) ? undefined : JSON.parse(req.query.past);
    past = (past === true) ? true : false; // if we should add the data for the previous period too, to compare
    var nextPage = req.query.nextPage; // the page of data to retrieve (for pushes and reviews for example)
    var limit = req.query.limit; // limit of data to retrieve (for pushes and reviews for example)

    // query limiters
    var gaLimiter = queryLimiters[req.session.user['user_id']+'']['ga'];
    var afLimiter = queryLimiters[req.session.user['user_id']+'']['af'];
    var uaLimiter = queryLimiters[req.session.user['user_id']+'']['ua'];

    // retrieving indicators datas by redirecting to the right connector and the right service
    switch (codeName) {
        // Google Analytics
        case 'uniqueVisitors': ga.query(codeName, 'ga:visitors', '', '', start, end, granularity, past, req.session, clients.ga, res, gaLimiter); break;
        case 'uniqueVisitorsCountry': ga.query(codeName, 'ga:visitors', 'ga:country', '', start, end, granularity, past, req.session, clients.ga, res, gaLimiter); break;
        case 'pageViews': ga.query(codeName, 'ga:pageviews', '', '', start, end, granularity, past, req.session, clients.ga, res, gaLimiter); break;
        case 'pageViewsPath': ga.query(codeName, 'ga:pageviews', 'ga:pagePath', '', start, end, granularity, past, req.session, clients.ga, res, gaLimiter); break;
        case 'avgTimePage': ga.query(codeName, 'ga:avgTimeOnPage', '', '', start, end, granularity, past, req.session, clients.ga, res, gaLimiter); break;
        case 'avgSessionDuration': ga.query(codeName, 'ga:avgSessionDuration', '', '', start, end, granularity, past, req.session, clients.ga, res, gaLimiter); break;
        case 'bounceRate': ga.query(codeName, 'ga:bounceRate', '', '', start, end, granularity, past, req.session, clients.ga, res, gaLimiter); break;
        case 'operatingSystemSessions': ga.query(codeName, 'ga:sessions', 'ga:operatingSystem', '-ga:sessions', start, end, granularity, past, req.session, clients.ga, res, gaLimiter); break;
        // AppFigures
        case 'allTimeDownloads': af.reports.query(codeName, 'reports/sales', 'downloads', true, start, end, granularity, past, req.session, clients.af, res, afLimiter); break;
        case 'downloads': af.reports.query(codeName, 'reports/sales', 'downloads', false, start, end, granularity, past, req.session, clients.af, res, afLimiter); break;
        case 'allTimeRevenue': af.reports.query(codeName, 'reports/sales', 'revenue', true, start, end, granularity, past, req.session, clients.af, res, afLimiter); break;
        case 'revenue': af.reports.query(codeName, 'reports/sales', 'revenue', false, start, end, granularity, past, req.session, clients.af, res, afLimiter); break;
        case 'allTimeUpdates': af.reports.query(codeName, 'reports/sales', 'updates', true, start, end, granularity, past, req.session, clients.af, res, afLimiter); break;
        case 'updates': af.reports.query(codeName, 'reports/sales', 'updates', false, start, end, granularity, past, req.session, clients.af, res, afLimiter); break;
        case 'ranks': af.ranks.query(codeName, 'ranks', start, end, granularity, past, req.session, clients.af, res, afLimiter); break;
        case 'ratings': af.ratings.query(codeName, 'ratings', start, end, req.session, clients.af, res, afLimiter); break;
        case 'reviews': af.reviews.query(codeName, 'reviews', start, end, limit, nextPage, req.session, clients.af, res, afLimiter); break;
        // UrbanAirship
        case 'sends': ua.global.query(codeName, 'reports/sends', 'sends', start, end, granularity, past, false, req.session, clients.ua, res, uaLimiter); break;
        case 'opens': ua.global.query(codeName, 'reports/opens', 'opens', start, end, granularity, past, false, req.session, clients.ua, res, uaLimiter); break;
        case 'timeinapp': ua.global.query(codeName, 'reports/timeinapp', 'timeinapp', start, end, granularity, past, true, req.session, clients.ua, res, uaLimiter); break;
        case 'optins': ua.global.query(codeName, 'reports/optins', 'optins', start, end, granularity, past, false, req.session, clients.ua, res, uaLimiter); break;
        case 'optouts': ua.global.query(codeName, 'reports/optouts', 'optouts', start, end, granularity, past, false, req.session, clients.ua, res, uaLimiter); break;
        case 'direct': ua.responses.query(codeName, 'reports/responses', 'direct', start, end, granularity, past, req.session, clients.ua, res, uaLimiter); break;
        case 'influenced': ua.responses.query(codeName, 'reports/responses', 'influenced', start, end, granularity, past, req.session, clients.ua, res, uaLimiter); break;
        case 'listing': ua.listing.query(codeName, 'reports/responses/list', start, end, limit, nextPage, req.session, clients.ua, res, uaLimiter); break;
    }
})

// route to get the partials views (rendered with ejs)
.get('/partials/:partial', function (req, res, next) {
    if (req.session.user == undefined) {res.redirect('/'); return;}
    var partial = req.params.partial;
    fs.exists('views/partials/' + partial + '.ejs', function (exists) {
        if (exists) {
            res.setHeader("Content-Type", "text/html");
            res.render('partials/' + partial, {'session': req.session});
        }
        else res.redirect('/');
    });
})

// route to get index page
.get('/', function (req, res, next) {
    res.setHeader("Content-Type", "text/html");
    res.render('index', {user: (req.session.user == undefined) ? undefined : req.session.user, login: req.query.login});
})

// route to get static files
.use(express.static(__dirname + '/app'))

// redirecting to index
.use(function (req, res, next) {
    res.redirect('/');
});

/* setting ssl certificate to create https server
pem.createCertificate({days:365, selfSigned:true}, function (err, keys) {
    https.createServer({key: keys.serviceKey, cert: keys.certificate}, app).listen(4300, 'localhost');
    pem.getPublicKey(keys.certificate, function (err, key) {
        console.log(keys.serviceKey);
        console.log(keys.certificate);
        console.log(key);
    });
    console.log('HTTPS Server running at https://localhost:4300/');
});*/

app.listen(1337, 'localhost');

console.log('HTTP Server running at http://localhost:1337/');
