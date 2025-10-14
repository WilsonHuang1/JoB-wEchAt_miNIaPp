'use strict';
exports.main = async (event, context) => {
    const {
        code
    } = event

    // Replace with your actual AppID and AppSecret from WeChat Mini Program backend
    const APPID = '	wx5e3a0bfbd015fe25'
    const SECRET = 'd1d5f9b38820946e66dcedefc82e16a6'

    const res = await uniCloud.httpclient.request(
        `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`, {
            method: 'GET',
            dataType: 'json'
        }
    )

    return res.data
}