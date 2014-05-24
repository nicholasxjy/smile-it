
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var ndir = require('ndir');
var config = require('./config');

config.upload_dir = config.upload_dir || path.join(__dirname, 'public', 'userprofile', 'images');

ndir.mkdir(config.upload_dir, function(err) {
    if (err) {
        throw err;
    }
});

var app = express();

// all environments
app.set('port', process.env.PORT || config.port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser({uploadDir: config.upload_dir}));
//app.use(express.json());
//app.use(express.urlencoded());
//app.use(express.multipart({uploadDir: config.upload_dir}));
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({secret: config.session_secret}));


app.use(require('./controllers/sign').auth_user);

app.use(express.static(path.join(__dirname, 'public')));
app.set('view cache', false);


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//routes here
routes(app);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
module.exports = app;
