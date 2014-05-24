/**
 * Created by nicholas_xue on 14-3-23.
 */
var mailer = require('nodemailer');
var config = require('../config');
var util = require('util');

var transport = mailer.createTransport('SMTP', config.mail_options);
var SITE_ROOT_URL = config.host;
/**
 * 发送邮件
 * @param {Object} data
 */
var sendEmail = function(data) {
    //遍历邮件数组，发送邮件，如果失败就在压入数组，重新发送
    transport.sendMail(data, function(err) {
        if (err) {
            console.log(err);
        }
    });
}
/**
 * 发送激活邮件
 * @param {String}touser 邮件地址
 * @param {String}token 编码过的token
 * @param {String}name 用户注册的name
 */
exports.sendActiveEmail = function(touser, token, name) {
    var from = util.format('%s <%s>', config.name, config.mail_options.auth.user);
    var to = touser;
    var subject = config.name + " 账号激活";
    var html = "<p>您好，</p>" + "<p>感谢注册 " + config.name + ", 请点击下面链接以激活账户</p>" +
        "<a href='" + SITE_ROOT_URL +"/active_account?key="+ token + "&name="+ name +"'>激活链接</a>"
        +"<p>再次欢迎您的到来，Having fun here!</p>";
    sendEmail({
        from: from,
        to: to,
        subject: subject,
        html: html
    });
};
/**
 * 发送重置密码邮件
 * @param touser
 * @param key
 * @param name
 */
exports.sendResetPasswordEmail = function(touser, key, name) {
    var from = util.format('%s <%s>', config.name, config.mail_options.auth.user);
    var to = touser;
    var subject = config.name + "重置密码";
    var html = "<p>您好，</p>" + "<p>请在24小时内点击下面的链接，来重置您的密码。</p>" +
        "<a href='" + SITE_ROOT_URL +"/reset-password?key="+ key +"&name="+ name +"'>重置密码链接</a>";
    sendEmail({
        from: from,
        to: to,
        subject: subject,
        html: html
    });
};

