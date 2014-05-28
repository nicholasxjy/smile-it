/**
 * Created by nicholas_xue on 14-4-6.
 */

/**
 * 格式化日期，前段显示体验
 * @param date
 * @param {boolean}friendly
 * @returns {string}
 */
exports.formatDate = function(date, friendly) {
    var year = date.getFullYear();
    var month = date.getMonth();
    var day = date.getDay();
    var hour = date.getHours();
    var minutes = date.getMinutes();
    //var seconds = date.getSeconds();
    var now = new Date();
    var msseconds = -(date.getTime() - now.getTime());
    var time_step = [1000, 1000*60, 1000*60*60, 1000*60*60*24];
    if (msseconds < time_step[3]) {//小于一天
        if (msseconds > 0 && msseconds < time_step[1]) {
            return Math.floor(msseconds/time_step[0]) + " 秒前";
        }
        if (msseconds > time_step[1] && msseconds < time_step[2]) {
            return Math.floor(msseconds/time_step[1]) + " 分钟前";
        }
        if (msseconds > time_step[2] && msseconds < time_step[3]) {
            return Math.floor(msseconds/time_step[2]) + " 小时前";
        }
    }
    if (friendly) {
        var thisyear = new Date().getFullYear();
        var year = (thisyear === year) ? '': (year+' 年 ');
        return year + (month+1) + ' 月 ' + (day+1) + ' 日 ' + hour + ':' + minutes;
    } else {
        return {
            'Year': year,
            'Month': month+1,
            'Day': day+1,
            'Hour': hour,
            'Minutes': minutes
        }
    }
};

exports.appendJokeString = function(joke, isLast) {
    var jsondata = '';
    var content = '';
    var pic_url = '';
    var credit = '';
    if (joke.content) {
        content = joke.content;
    }
    if (joke.pictures.length > 0) {
        pic_url = joke.pictures[0];
        credit = "Posted by " + joke.author.name;
    }
    if (!isLast) {
            jsondata = '{"startDate":' +'"'+ joke.create_at.getFullYear()+','+ (joke.create_at.getMonth()+1)+','
                + (joke.create_at.getDay()+1) +'",'
             + '"headline":' + '"'+ joke.title +'",'
             + '"text":' +'"<p>'+ content +'</p>",'
             + '"asset": { '
             + '"media":' + '"' + pic_url +'",'
             + '"credit":' + '"'+ credit +'",'
             + '"caption":' + '""'
             + '}},';
    } else {
            jsondata = '{"startDate":' +'"'+ joke.create_at.getFullYear()+','+ (joke.create_at.getMonth()+1)+','
                + (joke.create_at.getDay()+1) +'",'
             + '"headline":' + '"'+ joke.title +'",'
             + '"text":' +'"<p>'+ content +'</p>",'
             + '"asset": { '
             + '"media":' + '"' + pic_url +'",'
             + '"credit":' + '"'+ credit +'",'
             + '"caption":' + '""'
             + '}}';
    }

    return jsondata;
};
