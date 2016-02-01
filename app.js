var express = require('express');
var config = require('config');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var bodyParser = require('body-parser');

var morgan   = require('morgan');

var auth = require("./auth.js");

//////////////////////////////////
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');

////////////////////////////////////////////////



var app = express();
var port = config.Host.port || 3000;

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(cookieParser())
app.use(expressSession({secret:'somesecrettokenhere'}));
app.use(express.static(__dirname + '/public'));

auth(app);

app.listen(port);



