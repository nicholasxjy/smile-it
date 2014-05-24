var model = require('../models');
var LikeRelation = model.LikeRelation;

/**
 * 根据jokeid获得 点赞的关系
 * @param jokeid
 * @param callback
 */
exports.getLikeRelationByJokeId = function(jokeid, callback) {
	LikeRelation.find({joke_id: jokeid}, {}, {}, callback);
};
/**
 * 根据关键字获得点赞关系
 * @param query
 * @param callback
 */
exports.removeLikeRelationByQuery = function(query, callback) {
	LikeRelation.remove(query, callback);
};
/**
 * 创建新的点赞关系
 * @param jokeid
 * @param userid
 * @param callback
 */
exports.newAndSave = function(jokeid, userid, callback) {
	var likerelation = new LikeRelation();
	likerelation.joke_id = jokeid;
	likerelation.user_id = userid;
	likerelation.save(callback);
};