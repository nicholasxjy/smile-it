/**
 * Created by nicholas_xue on 14-3-24.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var RelationSchema = new Schema({
    user_id:{type:ObjectId},
    follow_id:{type:ObjectId},
    create_at:{type:Date, default:Date.now}
});

mongoose.model('Relation', RelationSchema);