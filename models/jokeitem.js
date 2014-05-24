/**
 * Created by nicholas_xue on 14-3-24.
 */
var config = require('../config');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var JokeSchema = new Schema({
    author_id:{type:ObjectId},
    title:{type:String, index:true},
    content:{type:String},
    pictures:{type:Array},//存放分享的图片，可以多个
    link:{type:String},
    reply_count:{type:Number, default:0},
    visit_count:{type:Number, default:0},
    like_count:{type:Number, default:0},
    is_allowed_transmited:{type:Boolean, default:true},
    create_at:{type:Date, default:Date.now}

});

mongoose.model('JokeItem', JokeSchema);