

var config = require('../config');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var LikeRelationSchema = new Schema({
	joke_id: {type: ObjectId},
	user_id: {type: ObjectId},
});

mongoose.model('LikeRelation', LikeRelationSchema);