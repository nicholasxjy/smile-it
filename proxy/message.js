var Message = require('../models').Message;

/**
 * 根据用户id查出该用户未读的信息个数
 * @param id
 * @param callback
 */
exports.getMessageCountByUserId = function(id, callback) {
    Message.count({masterid:id, has_read:false}, callback);
};
/**
 * 根据用户id 查出其未读信息
 * @param userid
 * @param callback
 */
exports.getMessageByUserId = function(userid, callback) {
    Message.find({masterid: userid, has_read: false}, callback);
};
/**
 * 新消息
 * @param type
 * @param masterid
 * @param authorid
 * @param jokeid
 * @param replyid
 * @param callback
 */
exports.newAndSave = function(type, masterid, authorid, jokeid, replyid, callback) {
	var message = new Message();
	message.type = type;
	message.masterid = masterid;
	message.authorid = authorid;
	message.jokeid = jokeid;
	message.replyid = replyid;
	message.save(callback);
};