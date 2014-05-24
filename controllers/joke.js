/**
 * Created by nicholas_xue on 14-3-30.
 */

var config = require('../config');
var Joke = require('../proxy').Joke;
var User = require('../proxy').User;
var Message = require('../proxy').Message;
var LikeRelation = require('../proxy').LikeRelation;
var ndir = require('ndir');
var path = require('path');
var fs = require('fs');
var EventProxy = require('eventproxy');
var Util = require('../libs/util');

exports.index = function(req, res, next) {
    var jokeid = req.params.jokeid;

    Joke.getJokeById(jokeid, function(err, joke, author, comments) {
        if (err) {
            return next(err);
        }
        //joke.visit_count += 1;
        joke.friendly_create_time = Util.formatDate(joke.create_at, true);
        joke.save(function(err) {
            if (err) {
                return next(err);
            }
        });

        if (!req.session.user) {
                joke.has_plus_one = false; 
                res.render('joke/index', {
                    joke: joke,
                    user: author,
                    comments: comments,
                    config: config
                });
        } else {
                var user = req.session.user;
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
                    res.render('joke/index', {
                        joke: joke,
                        user: author,
                        comments: comments,
                        config: config
                    });
                });
        }
        //todo current user and author relation, add follow button in front end side
    });
};

exports.showCreate = function(req, res, next) {
  if (!req.session.user) {
      return res.redirect('/signin');
  }
  res.render('joke/create', {
      config: config
  });
};
/**
 * 发表joke
 * @param req
 * @param res
 * @param next
 */
exports.createJoke = function(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/signin');
    }
    if (!req.body.title) {
        return res.json({status: 'fail'});
    }
    var title = req.body.title;
    var content = req.body.content || '';
    var link = req.body.link || '';
    //改用canvas upload图片，一个base64的流直接写入filename.png文件里
    var canvas_base64 = req.body.file;

    User.getUserById(req.session.user._id, function(err, user) {
        if (err) {
            return next(err);
        }
        var pictures = [];//存放图片的url
        var render = function() {
            Joke.newAndSave(user._id, title, content, pictures, link, function(err) {
                if (err) {
                    return next(err);
                }
                return res.json({status: 'success'});
            });
        };
        var proxy = EventProxy.create('joke_save', render);
        proxy.fail(next);
        var dateStamp = Date.now().toString();
        var picDir = path.join(config.upload_pictures_dir, dateStamp, user.name);
        if (canvas_base64){
            canvas_base64 = canvas_base64.replace(/^data:image\/png;base64,/, '');
            canvas_base64  +=  canvas_base64.replace('+', ' ');
            var binaryData = new Buffer(canvas_base64, 'base64').toString('binary');
            var ep = new EventProxy();
            ep.assign('picture_done', function() {
                proxy.emit('joke_save');
            });
            ep.fail(next);
            ndir.mkdir(picDir, function(err) {
                if (err) {
                    return next(err);
                }
                var filename = Date.now() + '_' + 'image' + '.png';
                var savepath = path.resolve(path.join(picDir, filename));
                var pic_url = config.site_static_host + '/upload_pics/pictures/' + dateStamp + '/' + user.name + '/'
                    + filename;
                pictures.push(pic_url);
                fs.writeFile(savepath, binaryData, 'binary', function(err) {
                    if (err) {
                        return next(err);
                    }
                    ep.emit('picture_done');
                });
            });
        } else {
            proxy.emit('joke_save');
        }
    });
};
/**
 * Ajax点赞 和 取消功能
 * @param req
 * @param res
 * @param next
 */
exports.plusOne = function(req, res, next) {
    if (!req.session.user) {
        res.json({status: 'failed', error: '请先登录'});
        return;
    }
    var user = req.session.user;
    var jokeid = req.body.jokeId;
    var likes = 0;
    Joke.getJokeById(jokeid, function(err, joke, author, comments) {
        if (err) {
            return next(err);
        }
        if (!joke) {
            res.json({status: 'failed'});
        }
        //只处理点赞，发消息给joke author  不能取消赞
        var render = function() {
            res.json({status: 'success', id: joke._id, likes: likes});
        };
        var proxy = EventProxy.create('message_save', 'joke_save', 'like_relation_save', render);
        proxy.fail(next);
        Message.newAndSave('add like', author._id, user._id, joke._id, joke.author_id, function(err) {
            if (err) {
                return next(err);
            }
            proxy.emit('message_save');
        });
        joke.like_count = joke.like_count + 1;
        likes = joke.like_count;
        joke.save(function(err) {
            if (err) {
                return next(err);
            }
            proxy.emit('joke_save');
        });
        LikeRelation.newAndSave(joke._id, user._id, function(err) {
            if (err) {
                return next(err);
            }
            proxy.emit('like_relation_save');
        });
    });
};