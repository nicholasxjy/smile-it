/**
 * Created by nicholas_xue on 14-3-24.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


var MessageSchema = new Schema({
    type: {type:String},
    masterid: {type:ObjectId, index:true},
    authorid: {type:ObjectId},
    jokeid: {type:ObjectId},
    replyid: {type:ObjectId},
    has_read: {type:Boolean, default:false},
    create_at: {type:Date, default:Date.now}
});
mongoose.model('Message', MessageSchema);