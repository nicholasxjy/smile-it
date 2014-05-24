/**
 * Created by nicholas_xue on 14-4-7.
 */
var model = require('../models');
var Comment = model.Comment;
var EventProxy = require('eventproxy');
var User = require('./user');
var Util = require('../libs/util');
/**
 * 根据每条jokeid 获取其对应的评论  以及评论作者和评论对象
 * @param jokeid
 * @param callback
 */
exports.getCommentsByJokeId = function(jokeid, callback) {
    Comment.find({joke_id: jokeid}, {}, {sort: {create_at: 'desc'}}, function(err, comments) {
        if (err) {
            return callback(err);
        }
        if (comments && comments.length === 0) {
            return callback(null, []);
        }
        var allcomments = [];
        var proxy = new EventProxy();
        proxy.after('comment_save', comments.length, function() {
            return callback(null, allcomments);
        });
        proxy.fail(callback);
        comments.forEach(function(acomment) {
            exports.getCommentById(acomment._id, function(err, comment) {
                if (err) {
                    return next(err);
                }
                User.getUserById(comment.author_id, function(err, author) {
                    if (err) {
                        return callback(err);
                    }
                    comment.author = author;
                    comment.friendly_create_time = Util.formatDate(comment.create_at, true);
                    allcomments.push(comment);
                    proxy.emit('comment_save');
                });
            });
        });
    });
};
/**
 * 根据id 查询Comment
 * @param id
 * @param callback
 */
exports.getCommentById = function(id, callback) {
    Comment.findOne({_id: id}, callback);
};
/**
 * 创建新评论
 * @param content
 * @param joke_id
 * @param author_id
 * @param reply_to_id
 * @param callback
 */
exports.newAndSave = function(content, joke_id, author_id, reply_to_id, callback) {
    var comment = new Comment();
    comment.content = content;
    comment.joke_id = joke_id;
    comment.author_id = author_id;
    comment.reply_to_id = reply_to_id;
    comment.save(callback);
};