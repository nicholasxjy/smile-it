/**
 * Created by nicholas_xue on 14-4-7.
 */
var config = require('../config');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var CommentSchema = new Schema({
    content: {type: String},
    joke_id: {type: ObjectId},
    author_id: {type: ObjectId},
    reply_to_id: {type: ObjectId},
    like_count: {type: Number, default: 0},
    create_at: {type: Date, default: Date.now}
});

mongoose.model('Comment', CommentSchema);