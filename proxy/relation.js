/**
 * Created by nicholas_xue on 14-3-24.
 */
var model = require('../models');
var Relation = model.Relation;
/**
 * 根据两用户id查找他们的关系
 * @param {ID} userId 被关注人
 * @param {ID} followId 关注人
 * @param callback
 */
exports.getRelation = function(userId, followId, callback) {
    Relation.findOne({user_id: userId, follow_id:followId}, callback);
};
/**
 * 删除关注关系
 * @param userId
 * @param followId
 * @param callback
 */
exports.removeRelation = function(userId, followId, callback) {
	Relation.remove({user_id: userId, follow_id:followId}, callback);
};
/**
 * 根据被关注的人 找出其所有的fans
 * @param userid
 * @param callback
 */
exports.getFansByUserId = function(userid, callback) {
    Relation.find({user_id: userid}, callback);
};
/**
 * 根据用户id 查询其关注的人
 * @param userid
 * @param callback
 */
exports.getFollowingsByUserId = function(userid, callback) {
    Relation.find({follow_id: userid}, callback);
};
/**
 * 创建新的关注 关系
 * @param userId
 * @param followId
 * @param callback
 */
exports.newAndSave = function(userId, followId, callback) {
	var relation = new Relation();
	relation.user_id = userId;
	relation.follow_id = followId;
	relation.save(callback);
};