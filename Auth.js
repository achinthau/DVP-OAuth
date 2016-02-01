var GitHubStrategy = require('passport-github').Strategy;
var passport = require('passport');
var config = require('config');
var jwt = require('jsonwebtoken');
var moment = require('moment');
var uuid = require('node-uuid');
var redis = require('redis');

var redisip = config.Redis.ip;
var redisport = config.Redis.port;

var redisClient = redis.createClient(redisport, redisip);

redisClient.on('error', function (err) {
    console.log('Error ' + err);
});




var dbmodel = require('dvp-dbmodels');


passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new GitHubStrategy({
        clientID: config.Authentication.clientId,
        clientSecret: config.Authentication.clientSecret,
        callbackURL: "http://45.55.142.207:3737/auth/github/callback"
    },
    function(accessToken, refreshToken, profile, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {

            return done(null, profile);
        });
    }
));



module.exports = function(app) {

    app.use(passport.initialize());
    app.use(passport.session());


    app.get('/', function(req, res) {


        var userObj = req.user;


        if(userObj) {




            dbmodel.Account.find({where: [{Username: req.user.username}]}).then(function (obj) {


                if (!obj) {




                    var account = dbmodel.Account.build({


                        Username: userObj.username,
                        Email: userObj.emails[0].value,
                        ProviderId: userObj.id,
                        ClientSecret: uuid.v4(),
                        DisplayName: userObj.displayName


                    })


                    account.save().then(function (inst) {


                        //redisClient.set("token:iss:"+obj.Username, obj.ClientSecret, redis.print);

                        account.avatar = userObj._json.avatar_url;
                        res.render('index', {user: account});


                    }).catch(function (err) {

                        res.render('index', {user: undefined});


                    })

                }
                else {

                    obj.avatar = userObj._json.avatar_url;
                    res.render('index', {user: obj});


                }

            }).catch(function (err) {

                res.render('index', {user: undefined});


            });


        }else{

            res.render('index', {user: undefined});

        }

    });









    app.get('/account', function(req, res) {



        var userObj = req.user;


        if(userObj) {




            dbmodel.Account.find({where: [{Username: req.user.username}]}).then(function (obj) {


                if (!obj) {


                    res.redirect('/');


                }
                else {

                    res.render('account', { user: obj });


                }

            }).catch(function (err) {

                res.redirect('/');


            });


        }else{

            res.redirect('/');

        }


    });


    app.get('/token', function(req, res) {

        res.render('token', { user: req.user, token: undefined });



    });


    app.get('/generate', function(req, res) {

        res.redirect('/token');



    });

    app.post('/generate', function(req, res) {



        var userObj = req.user;


        if(userObj) {




            dbmodel.Account.find({where: [{Username: req.user.username}]}).then(function (obj) {


                if (!obj) {


                    res.redirect('/');


                }
                else {

                    //res.render('account', { user: obj });

                    var jti = uuid.v4();
                    var secret = uuid.v4();
                    redisClient.set("token:iss:"+obj.Username+":"+jti, secret, redis.print);
                    //redisClient.expires();

                    var payload = {};
                    payload.iss = obj.Username;
                    payload.jti = jti;
                    payload.sub = config.Authentication.apiKey;
                    payload.exp = moment().add(7, 'days').unix()
                    payload.tenant = obj.id;


                    if(req.body.resource instanceof Array){

                        payload.scope = req.body.resource;

                    }else{

                        payload.scope= [];
                        payload.scope.push(req.body.resource);
                    }



                    var token = jwt.sign(payload, secret);

                    res.render('token', { user: req.user,token: token, tokenid:jti});




                    /*

                     {
                     "iss": "duoword.com",
                     "iat": 1300819370,
                     "exp": 1300819380,
                     "sub": "VOICE API TRUNK ACCESS",
                     "scopes": [
                     "trunk:read",
                     "trunk:write",
                     "trunk:delete"
                     ],
                     "context": {
                     "domain": {
                     "name": "ceb.duoworld.com",
                     "id": "121",
                     "activesubdomainid": "1",
                     "subdomain": [
                     {
                     "name": "anuradapura.ceb.duoworld.com",
                     "id": "1"
                     },
                     {
                     "name": "kuliyapitiya.ceb.duoworld.com",
                     "id": "2"
                     }
                     ]
                     }
                     }
                     }
                     */




                }

            }).catch(function (err) {

                res.redirect('/');


            });


        }else{

            res.redirect('/');

        }



    });

    app.get('/login', function(req, res) {

        res.render('login', { user: req.user });



    });

    app.get('/revoke', function(req, res) {

        res.render('revoke', { user: req.user });



    });

    app.post('/revoke', function(req, res) {

        if(req.body.token && req.user){

            redisClient.del("token:iss:"+req.user.username+":"+req.body.token, redis.print);


        }

        res.redirect('/');



    });




    app.get('/auth/github', passport.authenticate('github'), function(req, res){

        res.redirect('/');
    });


    app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }),

        function(req, res) {
            res.redirect('/');
        });



    app.get('/auth/github/logout', function(req, res) {

        req.logout();
        res.redirect('/');

    });






};