var config = require('../config');
var User = require('../proxy').User;
var EventProxy = require('eventproxy');
var Joke = require('../proxy').Joke;
var Message = require('../proxy').Message;
var LikeRelation = require('../proxy').LikeRelation;
var Loader = require('loader');

exports.index = function(req, res, next) {
    var page = parseInt(req.query.page, 10) || 1;
    var limit = config.joke_per_page;
    //查询当前用户的message 和 最近joke需要分页
    var render = function(recent_jokes, pages) {
        res.render('site/index', {
            config: config,
            pages: pages,
            recent_jokes: recent_jokes,
            limit: limit,
            currentpage: page,
            Loader: Loader
        });
    };
    var proxy = EventProxy.create('recent_jokes', 'pages', render);
    proxy.fail(next);
    //查询jokes 分页
    var options = {skip: (page - 1)*limit, limit: limit, sort: {create_at: 'desc'}};
    if (!req.session.user) {
        Joke.getJokesByQuery({}, options, proxy.done('recent_jokes'));
    } else {
        var user = req.session.user;
        var recent_jokes = [];
        Joke.getJokesByQuery({}, options, function(err, jokes) {
            if (err) {
                return next(err);
            }
            var ep = new EventProxy();
            ep.after('push_joke', jokes.length, function() {
                proxy.emit('recent_jokes', recent_jokes);
            });
            ep.fail(next);

            jokes.forEach(function(joke) {
                LikeRelation.getLikeRelationByJokeId(joke._id, function(err, docs) {
                    if (err) {
                        return next(err);
                    }
                    joke.has_plus_one = false;
                    var i = 0;
                    while(i < docs.length) {
                        if (docs[i].user_id.toString() === user._id.toString()) {
                            joke.has_plus_one = true;
                            break;
                        }
                        i = i + 1;
                    }
                    recent_jokes.push(joke);
                    ep.emit('push_joke');
                });
            });
        });
    }
    Joke.getJokesCountByQuery({}, proxy.done(function(pages_count) {
        var pages = Math.ceil(pages_count/limit);
        proxy.emit('pages', pages);
    }));
};
/**
 * 关于 页面
 * @param req
 * @param res
 * @param next
 */
exports.siteAbout = function(req, res, next) {
  res.render('about', {
      config: config
  });
};