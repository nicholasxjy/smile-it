var config = require('../config');
var User = require('../proxy').User;
var Joke = require('../proxy').Joke;
var Comment = require('../proxy').Comment;
var Message = require('../proxy').Message;
var EventProxy = require('eventproxy');
var Util = require('../libs/util');
/**
 * 添加评论
 * @param req
 * @param res
 * @param next
 */
exports.addComment = function(req, res, next) {
    if (!req.session.user) {
        res.json({status: 'failed', error: '请先登录'});
        return;
    }
    var user = req.session.user;
    var jokeid = req.body.jokeid;
    var content = req.body.content;
    var views = 0;
    var comment_count = 0;
    var proxy = EventProxy.create('joke_save', 'new_comment', 'new_message', function() {
       return res.json({status: 'success'});
    });
    proxy.fail(next);
    Joke.getJokeById(jokeid, function(err, joke, author, comments) {
        if (err) {
            return next(err);
        }
        if (!joke) {
            return res.json({status: 'failed', error: '信息有误!'});
        }
        joke.visit_count += 1;
        views = joke.visit_count;
        comment_count = comments.length + 1;
        joke.save(function(err) {
            if (err) {
                return next(err);
            }
            proxy.emit('joke_save');
        });
        Comment.newAndSave(content, jokeid, user._id, author._id, function(err) {
            if (err) {
                return next(err);
            }
            proxy.emit('new_comment');
        });
        Message.newAndSave('new comment', author._id, user._id, jokeid, author._id, function(err) {
            if (err) {
                return next(err);
            }
            proxy.emit('new_message');
        });
    });
};