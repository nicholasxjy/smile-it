var config = require('./config');

var site = require('./controllers/site');
var sign = require('./controllers/sign');
var user = require('./controllers/user');
var joke = require('./controllers/joke');
var auth = require('./middlewares/auth');
var comment = require('./controllers/comment');

module.exports = function(app) {
    //home page
    app.get('/', site.index);

    //account manage,signup signin
    //在此判断是否可以注册
    if (config.allowed_sign_up) {
        app.get('/signup', sign.showSignup);
        app.post('/signup', sign.signup);
    } else {
        //TODO这里或许可以允许第三方登陆,like weibo
    }

    app.get('/signin', sign.showSignin);
    app.post('/signin', sign.signin);

    app.get('/active_account', sign.active_account);

    app.get('/signout', sign.signout);

    //password find back
    app.get('/forgot-password', sign.showForgotPassword);
    app.post('/forgot-password', sign.findPassword);

    //password reset
    app.get('/reset-password', sign.resetPassword);
    app.post('/reset-password', sign.updateNewPassword);

    //user related operations
    app.get('/:name/timeline', user.index);
    app.get('/settings', user.showSettings);
    app.post('/settings', user.settings);
    //follow unfollow
    app.post('/user/follow', user.addFollow);

    //get fans
    app.get('/:name/fans', user.getMyFans);
    app.get('/:name/followings', user.getFollowings);
    app.get('/u/messages', user.getMessages);

    app.get('/joke/create', joke.showCreate);
    app.post('/joke/create', joke.createJoke);
    app.get('/joke/:jokeid', joke.index);

    //like or cancel like
    app.post('/joke/like-or-not', joke.plusOne);//这里设置需要登录才可点赞
    //comment

    app.post('/comment/add-comment', comment.addComment);
    app.post('/messages/empty', user.emptyMessages);


    app.get('/about', site.siteAbout);
};
