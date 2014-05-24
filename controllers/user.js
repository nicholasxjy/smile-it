/**
 * Created by nicholas_xue on 14-3-24.
 */
var config = require('../config');
var User = require('../proxy').User;
var Joke = require('../proxy').Joke;
var Relation = require('../proxy').Relation;
var Message = require('../proxy').Message;
var EventProxy = require('eventproxy');
var validator = require('validator');
var fs = require('fs');
var ndir = require('ndir');
var path = require('path');
var Util = require('../libs/util');


/**
 * 用户主页
 * @param req
 * @param res
 * @param next
 */
exports.index = function(req, res, next) {
    var username = req.params.name;
    User.getUserByName(username, function(err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            res.render('notify/notify', {
                error: "该用户不存在。",
                config: config
            });
            return;
        }
        //接下来 要根据此user查出该user的 未读message数量 关注几个人 被关注几人  最近发表的joke
        //此处需要 eventproxy，不然会嵌套太深，掉坑里。
        //npm new package
        var isUser = false;//判断访问的是否是自己
        if (req.session.user) {
            if (req.session.user._id.toString() === user._id.toString()) {
                isUser = true;
            }
        }
        var render = function(recent_jokes, relation, messages) {
            res.render('user/index', {
                user: user,
                config:config,
                recent_jokes: recent_jokes,
                relation: relation,
                messages: messages,
                isUser: isUser
            });
        };
        var proxy = new EventProxy();
        proxy.assign('recent_jokes', 'relation', 'messages', render);
        proxy.fail(next);

        var query = {author_id:user._id};
        var opts = {sort:{create_at:'desc'}};
        
        Joke.getJokesByQuery(query, opts, function(err, recent_jokes) {
            if (err) {
                return next(err);
            }
            var jsondata = '{"timeline" :{"headline":' + '"'+ user.name +'\'s Timeline",'
             + '"type":' + '"default",'
             + '"startDate":' + '"'+ user.create_at.getFullYear() +'",'
             + '"text":' +'"<p>'+ (user.profile ? user.profile: "") +'</p>",'
             + '"asset": { '
             + '"media":' + '"' + user.profile_image_url +'",'
             + '"credit":' + '"",'
             + '"caption":' + '""'
             + '}, "date": [';
            for(var i = 0; i < recent_jokes.length; i++) {
                if (i === recent_jokes.length -1) {
                   jsondata += Util.appendJokeString(recent_jokes[i], true);
                } else {
                    jsondata += Util.appendJokeString(recent_jokes[i], false);
                }
                
            }
            jsondata = jsondata + "] } }";
            //var filedata = JSON.parse(jsondata);
            //var data = JSON.stringify(filedata);
            var pathdir= config.user_json_file;
            var filename = (user.name + '.json').toString();
            filename = path.resolve(path.join(pathdir,filename));
            ndir.mkdir(pathdir, function(err) {
                if (err) {
                    return next(err);
                }
                fs.writeFile(filename, jsondata, function(err) {
                    if (err) {
                        return next(err);
                    }
                    proxy.emit('recent_jokes', recent_jokes);
                });
            });
            
        });
        
        

        if (!req.session.user) {
            proxy.emit('relation', null);
        } else {
            //获取 user 和req.session.user的关注关系，user是通过url的name参数获得的，而req.session.user是当前登录用户
            //也就是说当前登录用户，去查看别的用户主页
            Relation.getRelation(user._id, req.session.user._id, proxy.done('relation'));//此处是为了前端显示 关注还是取消关注
        }
        Message.getMessageCountByUserId(user._id, proxy.done('messages'));
    });
};
/**
 * 显示settings页面，必须登录
 * @param req
 * @param res
 * @param next
 */
exports.showSettings = function(req, res, next) {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }
    User.getUserById(req.session.user._id, function(err, user) {
        if (err) {
            return next(err);
        }
        return res.render('user/settings', {
            user: user,
            config: config
        });
    });
};
/**
 * 用户setting信息
 * @param req
 * @param res
 * @param next
 */
exports.settings = function(req, res, next) {
    if (!req.session.user) {
        res.redirect('/');
        return;
    }
    var gender = parseInt(req.body.gender);
    var location = req.body.location;
    var profile = req.body.profile;
    //这里是base64 data的图片
    var base64Data = req.body.file;

    User.getUserById(req.session.user._id, function(err, user) {
        user.gender = gender;
        user.location = location;
        user.profile = profile;
        //这里修改头像，将上传图片经过处理的url赋给profile-image-url
        //图片的路径赋值为uid/date.now+file.name
        if (base64Data) {
            base64Data = base64Data.replace(/^data:image\/png;base64,/, '');
            base64Data  +=  base64Data.replace('+', ' ');
            var binaryData = new Buffer(base64Data, 'base64').toString('binary');
            var uid = user._id.toString();
            var userDir = path.join(config.upload_dir, uid);
            ndir.mkdir(userDir, function(err) {
                if (err) {
                    return next(err);
                }
                var filename = Date.now() + '_' + user.name +'_profileimage.png';
                var savepath = path.resolve(path.join(userDir, filename));
                user.profile_image_url = config.site_static_host + '/userprofile/images/'+uid+'/'+filename;
                fs.writeFile(savepath, binaryData, 'binary', function(err) {
                    if (err) {
                        return next(err);
                    }
                    user.save(function(err) {
                        if (err) {
                            return next(err);
                        }
                        return res.json({status: 'success'});
                    })
                });
            });
        } else {
            if (user.profile_image_url) {
                user.profile_image_url = user.profile_image_url;
            }
            user.save(function(err) {
                if (err) {
                    return next(err);
                }
                return res.json({status: 'success'});
            });
        }

    });
};
/**
 * 用户之间的 关注 取消等操作
 * @param req
 * @param res
 * @param next
 */
exports.addFollow = function(req, res, next) {
    if (!req.session.user) {
        res.json({status: 'failed', error: '请先登录'});
        return;
    }
    var user = req.session.user;
    var follow_userid = req.body.userid;
    var action = req.body.action;
    var count = 0;
    var render = function() {
        res.json({status: 'success', count: count});
    };
    var proxy = EventProxy.create('relation_save', 'followed_save', 'following_save', render);
    proxy.fail(next);
    if (action === 'add-follow') {
        Relation.newAndSave(follow_userid, user._id, function(err) {
            if (err) {
                return next(err);
            }
            proxy.emit('relation_save');
        });
        User.getUserById(follow_userid, function(err, doc) {
            if (err) {
                return next(err);
            }
            doc.follower_count = parseInt(doc.follower_count) + 1;
            count = parseInt(doc.follower_count);
            doc.save(function(err) {
                if (err) {
                    return next(err);
                }
                proxy.emit('followed_save');
            });
        });
        User.getUserById(user._id, function(err, doc) {
            if (err) {
                return next(err);
            }
            doc.following_count = parseInt(doc.following_count) + 1;
            doc.save(function(err) {
                if (err) {
                    return next(err);
                }
                proxy.emit('following_save')
            });
        });
    } else {
        Relation.removeRelation(follow_userid, user._id, function(err) {
            if (err) {
                return next(err);
            }
            proxy.emit('relation_save');
        });
        User.getUserById(follow_userid, function(err, doc) {
            if (err) {
                return next(err);
            }
            if (parseInt(doc.follower_count) > 0) {
                doc.follower_count = parseInt(doc.follower_count) - 1;
            } else {
                doc.follower_count = 0;
            }
            count = parseInt(doc.follower_count);
            doc.save(function(err) {
                if (err) {
                    return next(err);
                }
                proxy.emit('followed_save');
            });
        });
        User.getUserById(user._id, function(err, doc) {
            if (err) {
                return next(err);
            }
            if (parseInt(doc.following_count) > 0) {
                doc.following_count = parseInt(doc.following_count) - 1;
            } else {
                doc.following_count = 0;
            }
            doc.save(function(err) {
                if (err) {
                    return next(err);
                }
                proxy.emit('following_save')
            });
        });
    }
};
/**
 * 根据用户名获得其粉丝信息
 * @param req
 * @param res
 * @param next
 */
exports.getMyFans = function(req, res, next) {
    var username = req.params.username;
    if (!username) {
        res.render('notify/notify', {
            error: '信息有误',
            config: config
        });
        return;
    }
    var fansids = [];
    var isUser = false;
    User.getUserByName(username, function(err, user) {
        if (err) {
            return next(err);
        }
        if (req.session.user && req.session.user._id.toString() === user._id.toString()) {
            isUser = true;
        }
        Relation.getFansByUserId(user._id, function(err, docs) {
            if (docs && docs.length > 0) {
                for(var i = 0; i < docs.length; i++) {
                    fansids.push(docs[i].follow_id);
                }
                User.getUsersByIds(fansids, function(err, fans) {
                    if (err) {
                        return next(err);
                    }
                    res.render('user/fans', {
                        config: config,
                        fans: fans,
                        user: user,
                        isUser: isUser
                    });
                });
            } else {
                res.render('user/fans', {
                    config: config,
                    fans: [],
                    user: user,
                    isUser: isUser
                })
            }
        });
    });
};
/**
 * 根据用户 获得其关注人
 * @param req
 * @param res
 * @param next
 */
exports.getFollowings = function(req, res, next) {
    var username = req.params.username;
    if (!username) {
        res.render('notify/notify', {
            error: '信息有误',
            config: config
        });
        return;
    }
    var followids = [];
    var isUser = false;
    User.getUserByName(username, function(err, user) {
        if (err) {
            return next(err);
        }
        if (req.session.user && req.session.user._id.toString() === user._id.toString()) {
            isUser = true;
        }
        Relation.getFollowingsByUserId(user._id, function(err, docs) {
            if (docs && docs.length > 0) {
                for(var i = 0; i < docs.length; i++) {
                    followids.push(docs[i].user_id);
                }
                User.getUsersByIds(followids, function(err, followings) {
                    if (err) {
                        return next(err);
                    }
                    res.render('user/followings', {
                        config: config,
                        followings: followings,
                        user: user,
                        isUser: isUser
                    });
                });
            } else {
                res.render('user/followings', {
                    config: config,
                    followings: [],
                    user: user,
                    isUser: isUser
                });
            }
        });
    });
};
/**
 * 登录用户未读信息页面
 * @param req
 * @param res
 * @param next
 */
exports.getMessages = function(req, res, next) {
    if (!req.session.user) {
        res.redirect('/signin');
        return;
    }
    //var not_read_ms = [];
    var render = function(messages) {
        res.render('user/messages', {
            config: config,
            messages: messages,
            user: req.session.user
        });
    };
    var proxy = EventProxy.create('messages_done', render);
    proxy.fail(next);
    Message.getMessageByUserId(req.session.user._id, function(err, docs) {
       if (err) {
           return next(err);
       }
        proxy.after('message_done', docs.length, function(messages) {
           proxy.emit('messages_done', messages);
        });
       //根据回复者的id查出其信息
        docs.forEach(function(doc) {
            User.getUserById(doc.authorid, function(err, author) {
                if (err) {
                    return next(err);
                }
                doc.author = author;
                proxy.emit('message_done', doc);
            });
        });
    });
};
/**
 * 清空未读信息
 * @param req
 * @param res
 * @param next
 */
exports.emptyMessages = function(req, res, next) {
    var user = req.session.user;
    if (!user) {
        res.json({
            error: '发生错误',
            status: 'failed'
        });
    }
    var proxy = EventProxy.create('done', function() {
       res.json({
           status: 'success'
       });
    });
    Message.getMessageByUserId(user._id, function(err, docs) {
       if (err) {
           return next(err);
       }
        proxy.after('save_done', docs.length, function() {
           proxy.emit('done');
        });
        docs.forEach(function(doc) {
           doc.has_read = true;
           doc.save(function(err) {
               if (err) {
                   return next(err);
               }
               proxy.emit('save_done');
           });
        });
    });
};
