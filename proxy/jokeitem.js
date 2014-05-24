/**
 * Created by nicholas_xue on 14-3-24.
 */
var model = require('../models');
var Joke = model.Joke;
var EventProxy = require('eventproxy');
var User = require('./user');
var Comment = require('./comment');
var Util = require('../libs/util');

/**
 * 根据jokeid 获取此joke和对应的作者，以及评论
 * @param id
 * @param callback
 */
exports.getJokeById = function(id, callback) {
    var proxy = EventProxy.create('joke', 'author', 'comments', function(joke, author, comments) {
        return callback(null, joke, author, comments);
    });
    proxy.fail(callback);

    Joke.findOne({_id: id}, proxy.done(function(joke) {
        if (!joke) {
            proxy.emit('joke', null);
            proxy.emit('author', null);
            proxy.emit('comments', []);
            return;
        }
        proxy.emit('joke', joke);

        User.getUserById(joke.author_id, proxy.done('author'));

        Comment.getCommentsByJokeId(joke._id, proxy.done('comments'));

    }));
};
/**
 * 根据关键字 查找一组jokeitem
 * @param query
 * @param opts
 * @param callback
 */
exports.getJokesByQuery = function(query, opts, callback) {
    Joke.find(query, {}, opts, function(err, jokes) {
        if (err) {
            return callback(err);
        }
        if (!jokes || jokes.length === 0) {
            return callback(null, []);
        }
        var joke_ids = [];
        for(var j = 0; j < jokes.length; j++) {
            joke_ids.push(jokes[j]._id);
        }
        var proxy = new EventProxy();
        proxy.after('joke_save', joke_ids.length, function(recent_jokes) {
            return callback(null, recent_jokes);
        });
        proxy.fail(callback);
        for(var i = 0; i < joke_ids.length; i++) {
            exports.getJokeById(joke_ids[i], proxy.group('joke_save', function(joke, author, comments) {
                if (err) {
                    return callback(err);
                }
                if (joke) {
                    joke.author = author;
                    joke.comments = comments;
                    joke.friendly_create_time = Util.formatDate(joke.create_at, true);
                }
                return joke;
            }));
        }
    });
};
/**
 * 根据条件查出Jokes的个数
 * @param query
 * @param callback
 */
exports.getJokesCountByQuery = function(query, callback) {
    Joke.count(query, callback);
};
/**
 * 根据userid获得该用户所有的jokes
 * @param userid
 * @param callback
 */
exports.getLatestJokeByUserId = function(userid, callback) {
    Joke.find({author_id: userid}, {}, {sort: {create_at: 'desc'}}, callback);
};
/**
 * 新增joke
 * @param authotid
 * @param title
 * @param content
 * @param pictures
 * @param link
 * @param callback
 */
exports.newAndSave = function(authotid, title, content, pictures, link, callback) {
    var joke = new Joke();
    joke.author_id = authotid;
    joke.title = title;
    joke.content = content;
    joke.pictures = pictures;
    joke.link = link;
    joke.save(callback);
};