/**
 * config
 */

var path = require('path');
var pkg = require('./package.json');
//config用来配置网站
var config = {
    debug: true, //用来切换，开发和上线
    author: 'nicholas',
    name: "Joke Of Day",
    description: "We just want every day is full of smile.",
    version: pkg.version,

    google_tracer_id: '*******', //google analysis

    host: 'http://127.0.0.1:3000',
    site_icon: '', //网站小图标
    site_static_host: 'http://127.0.0.1:3000',
    upload_dir: path.join(__dirname, 'public', 'userprofile', 'images'),
    upload_pictures_dir: path.join(__dirname, 'public', 'upload_pics', 'pictures'),
    default_image: 'http://127.0.0.1:3000/userprofile/default_user_icon.jpg',
    user_json_file: path.join(__dirname, 'public', 'userprofile', 'json'),
    db: 'mongodb://127.0.0.1/jokeday_dev',
    session_secret: 'jokeday',
    auth_cookie_name: 'jokeday',
    port: 3000,

    //每页显示 标签数量，为分页准备
    joke_per_page: 8,

    //限制发帖时间间隔，防止不良dude, come on.is this necessary?
    post_interval: 100000, //10s

    //友情链接
    site_links: [{
        'text': 'hello',
        'url': 'http://jokeday.com'
    }],


    site_ads: [{
        'url': '',
        'image': '',
        'text': ''
    }],

    //邮件系统设置
    mail_options: {
        host: 'smtp.126.com',
        port: 25,
        auth: {
            user: 'jokeofday@126.com',
            pass: 'hilarious4862'
        }
    },
    //管理员认证，富有一定的权限
    admins: {
        'name': true
    },

    //weibo api key
    weibo_api: {
        apikey: '',
        clientid: ''
    },

    allowed_sign_up: true


};

module.exports = config;