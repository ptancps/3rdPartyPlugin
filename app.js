var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var auth = require('./routes/auth');
var load = require('./routes/load');
var uninstall = require('./routes/uninstall');
var index = require('./routes/index');
var hbs = require("hbs")
const cookieParser2 = require("cookie-parser");
const fetch = require('node-fetch');
var bodyParser = require('body-parser')
var cors = require('cors')

const moment = require("moment");

var paginate = require('handlebars-paginate');

hbs.registerHelper('paginate', paginate);

hbs.registerHelper('dateFormat', function (date, options) {
    const formatToUse = (arguments[1] && arguments[1].hash && arguments[1].hash.format) || "DD/MM/YYYY"
    return moment(date).format(formatToUse);
});

hbs.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser2());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + "/views/partials"); // Place `hbs.registerPartials` in here!

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', auth);
app.use('/load', load);
app.use('/uninstall', uninstall);
app.use('/index', index);


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
