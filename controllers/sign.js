/**
 * Created by nicholas_xue on 14-3-23.
 */
var validator = require('validator');
var crypto = require('crypto');
var config = require('../config');
var User = require('../proxy').User;
var Message = require('../proxy').Message;
var mail = require('../services/mail');
var EventProxy = require('eventproxy');

//注册系列操作
exports.showSignup = function(req, res) {
    res.render('sign/signup', {
        config: config
    });
};

exports.signup = function(req, res, next) {
    var name = validator.trim(req.body.name) ;
    var loginname = name.toLowerCase();
    var pass = validator.trim(req.body.pass);
    var email = validator.trim(req.body.email);
    var re_pass = validator.trim(req.body.repass);
    //info validate
    if (name === '' || pass === '' || re_pass === '' || email === '') {
        res.render('sign/signup', {
            error: '请检查信息的完整性。',
            name: name,
            email: email,
            config: config
        });
        return;
    }
    if (pass.length < 6) {
        res.render('sign/signup', {
            error: '密码至少6位!',
            name: name,
            email: email,
            config: config
        });
        return;
    }
    //检查用户名只能包含字母和数字
    if (!validator.isAlphanumeric(name)) {
        res.render('sign/signup', {
            error: '用户名只能包含字母和数字，亲!',
            name: name,
            email: email,
            config: config
        });
        return;
    }
    if (pass !== re_pass) {
        res.render('sign/signup', {
            error: '两次密码输入不一致。',
            name: name,
            email: email,
            config: config
        });
        return;
    }
    //检查邮箱地址是否正确
    if (!validator.isEmail(email)) {
        res.render('sign/signup', {
            error: '邮箱地址不正确，请重新确认。',
            name: name,
            email: email,
            config: config
        });
        return;
    }
    //输入信息格式没问题，需要检查loginname,email是否没有占用
    User.getUsersByQuery({'$or': [{'loginname': loginname}, {'email': email}]}, {}, function(err, users) {
        if (err) {
            return next(err);
        }
        if (users.length > 0) {
            res.render('sign/signup', {
                error: '该用户名或邮箱已被使用!',
                name: name,
                email: email,
                config: config
            });
            return;
        }

        //crypto pass
        pass = md5(pass);
        //load avatar if user has
        var avatar_url = "http://www.gravatar.com/avatar/" + md5(email.toLowerCase()) + "?size=48";//size根据需要修改
        //保存新用户
        User.newAndSave(name, loginname, pass, email, avatar_url,false, function(err) {
            if (err) {
                return next(err);
            }
            //此处发送激活邮件，并提醒用户查看
            var token = md5(email + config.session_secret);
            mail.sendActiveEmail(email, token, name);
            res.render('sign/signup', {
                success: "欢迎来到" + config.name + "! 我们给你的注册邮箱发送了一份激活邮件，请点击其中链接以激活您的账号。",
                config: config
            });
        });
    });
};
/**
 * 激活邮件链接 过来的激活操作
 * @param req
 * @param res
 * @param next
 */
exports.active_account = function(req, res, next) {
    var name = req.query.name;
    var key = req.query.key;
    User.getUserByName(name, function(err, user) {
        if (err) {
            return next(err);
        }
        if (!user || md5(user.email + config.session_secret) !== key) {
            return res.render('notify/notify', {
                config: config,
                error: '信息有误，账号无法激活'
            });
        }
        if (user.active) {
            return res.render('notify/notify', {
                config: config,
                error: '此账号已经激活'
            });
        }
        user.active = true;
        user.save(function(err) {
            if (err) {
                return next(err);
            }
            return res.render('notify/notify', {
                config: config,
                success: '账号已被激活，请登录'
            });
        });
    });
};

/**
 * 展示login page
 * @param req
 * @param res
 */
exports.showSignin = function(req, res) {
    req.session._loginReferer = req.headers.referer;//这里将url，赋给session是为了，登录后跳回原来页面
    res.render('sign/signin', {
        config: config
    });
};
/**
 * 用户登录
 * @param req
 * @param res
 * @param next
 */
exports.signin = function(req, res, next) {
    var loginname = validator.trim(req.body.name.toString()).toLowerCase();
    var pass = validator.trim(req.body.pass.toString());

    if (!loginname || !pass) {
        res.render('sign/signin', {
            error: "请检查信息的填写",
            config: config
        });
        return;
    }
    //通过登录用户名，查出用户，然后再去验证密码
    User.getUserByLoginName(loginname, function(err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            res.render('sign/signin', {
                error: "这个用户不存在!",
                config: config
            });
            return;
        }
        pass = md5(pass);
        if (pass !== user.pass) {
            res.render('sign/signin', {
                error: "密码错误!",
                config: config
            });
            return;
        }
        //再次验证，账户激活没有？没有 重新发送激活邮件，提醒用户
        if (!user.active) {
            mail.sendActiveEmail(user.email, md5(user.email.toLowerCase() + config.session_secret), user.name);
            res.render('sign/signin', {
                error: "此账号还没有激活，激活链接已发送到您的邮箱 " + user.email + "请查收。",
                config: config
            });
            return;
        }
        //此处 做了cookie设置
        generate_session(user, res);
        req.session.user = user;
        res.redirect('/');
    });
};
/**
 * 退出操作
 * @param req
 * @param res
 */
exports.signout = function(req, res, next) {
    req.session.destroy();//清空session
    res.clearCookie(config.auth_cookie_name, {path: '/'});//销毁cookie
    res.redirect('/');//跳转
};
/**
 * get 忘记密码
 * @param req
 * @param res
 */
exports.showForgotPassword = function(req, res) {
    res.render('sign/forget-pass', {
        config: config
    });
};
/**
 * 找回密码操作
 * @param req
 * @param res
 * @param next
 */
exports.findPassword = function findPassword(req, res, next) {
    var email = validator.trim(req.body.email.toString());
    email = email.toLowerCase();
    if (!validator.isEmail(email)) {
        res.render('sign/forget-pass', {
            config: config,
            error: "邮箱地址不正确"
        });
        return;
    }
    //动态生成key和timestamp，存入数据库 重置密码时，做比较
    var retrieveKey = randomString(15);
    var retrieveTime = new Date().getTime();
    User.getUserByEmail(email, function(err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            res.render('sign/forget-pass', {
                error: "此邮箱不存在",
                config: config
            });
            return;
        }
        user.retrieve_key = retrieveKey;
        user.retrieve_time = retrieveTime;
        user.save(function(err) {
            if (err) {
                return next(err);
            }
        });
        //发送重置密码邮件
        mail.sendResetPasswordEmail(user.email, retrieveKey, user.name);
        res.render('notify/notify', {
            success: "我们给您发送了一封重置密码的邮件，请在24小时内点击里面的链接来重置密码。",
            config: config
        });
    });
};
/**
 * 从邮件点击重置链接，验证相关信息后，展示重置界面
 * @param req
 * @param res
 * @param next
 */
exports.resetPassword = function(req, res, next) {
    var key = req.query.key;
    var name = req.query.name;
    User.getUserByQuery(name, key, function(err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            res.render('notify/notify', {
                error: "信息有误，无法重置。",
                config: config
            });
            return;
        }
        var now = new Date().getTime();
        var oneDay = 1000 * 60 * 60 * 24;
        if (!user.retrieve_time || now - user.retrieve_time > oneDay) {
            res.render('notify/notify', {
                error: "该链接已超出规定时间，请重新申请。",
                config: config
            });
            return;
        }
        //如果验证信息通过，则展示重置密码的界面
        res.render('sign/reset-pass', {
            name: name,
            key: key,
            config: config
        });
    });
};
/**
 * 通过重置页面post过来的一系列重置密码操作
 * @param req
 * @param res
 * @param next
 */
exports.updateNewPassword = function(req, res, next) {
    var name = req.body.name || "";
    var key = req.body.key || "";
    var pass = req.body.pass || "";
    var repass = req.body.repass || "";
    if (pass !== repass) {
        res.render('sign/reset-pass', {
            error: "两次密码输入不一致。",
            config:config
        });
        return;
    }
    User.getUserByQuery(name, key, function(err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            res.render('notify/notify', {
                error: "错误的激活链接。",
                config: config
            });
            return;
        }
        user.pass = md5(pass);
        //置成null，下次重新赋值
        user.retrieve_key = null;
        user.retrieve_time = null;
        user.active = true;
        user.save(function(err) {
            if (err) {
                return next(err);
            }
        });
        res.render('notify/notify', {
            success: "您的密码已成功重置，请重新登录。",
            config: config
        });
    });
};
/**
 * 始终保证用户都有头像（没有的设定了默认）
 * @param user
 * @returns {*}
 */
function getAvatarURL(user) {
    if (user.avatar_url) {
        return user.avatar_url;
    }
    var avatar_url = user.profile_image_url || user.avatar;
    if (!avatar_url) {
        avatar_url = config.site_static_host + "/public/images/user_default_icon.png";
    }
    return avatar_url;
};
/**
 * auth user middleware
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
exports.auth_user = function(req, res, next) {

    if (req.session.user) {
        //此处不能直接用user，必须从数据库重新获取，因为可能更新了数据
        User.getUserById(req.session.user._id, function(err, user) {
            if (err) {
                return next(err);
            }
            if (user) {
                if (config.admins.hasOwnProperty(user.name)) {
                    user.is_admin = true;
                }
                Message.getMessageCountByUserId(user._id, function(err, count) {
                    if (err) {
                        return next(err);
                    }
                    count = count || 0;
                    user.message_not_read = count;
                    req.session.user = user;
                    res.locals({current_user: user});
                    return next();
                });
            } else {
                return next();
            }
        });

    } else {
        var cookie = req.cookies[config.auth_cookie_name];
        if (!cookie) {
            return next();
        }
        var auth_token = decryt(cookie, config.session_secret);
        var auth = auth_token.split(' ');
        var userid = auth[0];
        User.getUserById(userid, function(err, user) {
            if (err) {
                return next(err);
            }
            if (user) {
                if (config.admins.hasOwnProperty(user.name)) {
                    user.is_admin = true;
                }
                Message.getMessageCountByUserId(user._id, function(err, count) {
                    if (err) {
                        return next(err);
                    }
                    count = count || 0;
                    user.message_not_read = count;
                    req.session.user = user;
                    res.locals({current_user: user});
                    return next();
                });

            } else {
               return next();
            }
        });
    }
};
/**
 * 创建cookie
 * @param user
 * @param res
 */
function generate_session(user, res) {
    var auth_token = encryt(user.id+' '+user.name+' '+user.pass+' '+ user.email, config.session_secret);
    res.cookie(config.auth_cookie_name, auth_token, {path: '/', maxAge: 1000*60*60*24*30});//时间设置为30天
}
exports.generate_session = generate_session;
/**
 * md5加密
 * @param str
 * @returns {*}
 */
function md5(str) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(str);
    str = md5sum.digest('hex');
    return str;
}
/**
 * 加密
 * @param str
 * @param secret
 * @returns {*|Query}
 */
function encryt(str, secret) {
    var cipher = crypto.createCipher('aes192', secret);
    var enc = cipher.update(str, 'utf8', 'hex');
    enc += cipher.final('hex');
    return enc;
}
/**
 * 解密
 * @param str
 * @param secret
 * @returns {*|Query}
 */
function decryt(str, secret) {
    var decipher = crypto.createDecipher('aes192', secret);
    var denc = decipher.update(str, 'hex', 'utf8');
    denc += decipher.final('utf8');
    return denc;
}
/**
 * 随机产生给定大小的字符串
 * @param size
 * @returns {string}
 */
function randomString(size) {
    size = size || 6;
    var codeString = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var maxNum = codeString.length + 1;
    var code = "";
    while(size > 0) {
        code += codeString.charAt(Math.floor(Math.random() * maxNum));
        size--;
    }
    return code;
}