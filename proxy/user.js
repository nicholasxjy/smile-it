/**
 * Created by nicholas_xue on 14-3-23.
 */
var models = require('../models');//导入包，会从index文件查找
var User = models.User;

/**
 * 根据用户名列表查找用户
 * @param{Array} names
 * @param{Function} callback
 */
exports.getUserByNames = function(names, callback) {
    if (names.length === 0) {
        return callback(null, []);//回调函数第一个参数一般为err,[]代表查到的user
    }
    User.find({name: {$in: names}}, callback);
};
/**
 * 根据登录名查找用户(可以检查是否用户名已被占用)
 * @param {String}loginname
 * @param {Function}callback
 */
exports.getUserByLoginName = function(loginname, callback) {
    User.findOne({'loginname': loginname}, callback);
};
/**
 * 根据关键字，获取一组用户
 * @param {Object}query
 * @param {Object}opts
 * @param {Function}callback
 */
exports.getUsersByQuery = function(query, opts, callback) {
    User.find(query, {}, opts, callback);
};
/**
 * 通过email查找唯一用户
 * @param email
 * @param callback
 */
exports.getUserByEmail = function(email, callback) {
    User.findOne({email: email}, callback);
};
/**
 * 根据name 和retrieve_key查找唯一用户，以重置密码
 * @param name
 * @param key
 * @param callback
 */
exports.getUserByQuery = function(name, key, callback) {
    User.findOne({name: name, retrieve_key: key}, callback);
};
/**
 * 根据用户id获得唯一用户
 * @param id
 * @param callback
 */
exports.getUserById = function(id, callback) {
    User.findOne({_id:id}, callback);
};

exports.getUsersByIds = function(ids, callback) {
    if (ids.length === 0) {
        return callback(null, []);
    }
    User.find({_id: {$in: ids}}, callback);
}
/**
 * 根据用户名查找唯一用户
 * @param name
 * @param callback
 */
exports.getUserByName = function(name, callback) {
    User.findOne({name:name}, callback);
};
/**
 * 保存新注册用户
 * @param name
 * @param loginname
 * @param pass
 * @param email
 * @param avatar_url
 * @param active
 * @param callback
 */
exports.newAndSave = function(name, loginname, pass, email, avatar_url, active, callback) {
    var user = new User();
    user.name = name;
    user.loginname = loginname;
    user.pass = pass;
    user.email = email;
    user.avatar_url = avatar_url;
    user.active = active;//需要发送激活邮件，来激活，注册调用默认为false
    user.save(callback);
};
