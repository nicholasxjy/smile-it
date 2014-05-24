/**
 * Created by nicholas_xue on 14-3-23.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../config');

var UserSchema = new Schema({
    name: {type:String, index:true},
    loginname: {type:String, unique: true},
    pass: {type:String},
    email: {type:String, unique:true},
    profile_image_url: {type:String, default: config.default_image},
    location: {type:String},
    profile: {type:String},
    avatar: {type:String},
    gender: {type:Number, default:0},//0: 男 1:女
    is_block: {type:Boolean, default:false},

    score: {type:Number, default:0},
    topic_count: {type:Number, default:0},
    reply_count: {type:Number, default:0},
    follower_count: {type:Number, default:0},
    following_count: {type:Number, default:0},

    create_at: {type:Date, default:Date.now},
    update_at: {type:Date, default:Date.now},
    is_admin: {type:Boolean, default:false},
    is_star: {type:Boolean},
    level: {type:String},

    active: {type:Boolean, default:true},

    receive_reply_mail:{type:Boolean, default:false},

    retrieve_time: {type:Number},
    retrieve_key:{type:String}

});

UserSchema.virtual('avatar_url').get(function() {
    var url = this.profile_image_url || this.avatar || config.site_static_host + "public/images/default_user_icon.png";
    return url;
});

mongoose.model('User', UserSchema);