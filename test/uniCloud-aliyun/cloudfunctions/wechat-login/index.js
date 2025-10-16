'use strict';
exports.main = async (event, context) => {
    const {
        code
    } = event;

    // WeChat Mini Program credentials
    const APPID = 'wx5e3a0bfbd015fe25'; // Remove the tab character before 'wx'
    const SECRET = 'd1d5f9b38820946e66dcedefc82e16a6';

    try {
        // Call WeChat API
        const res = await uniCloud.httpclient.request(
            `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`, {
                method: 'GET',
                dataType: 'json'
            }
        );

        const {
            openid,
            session_key,
            unionid,
            errcode,
            errmsg
        } = res.data;

        // Check for WeChat API errors
        if (errcode) {
            console.error('WeChat API error:', errcode, errmsg);
            return {
                code: errcode,
                message: errmsg
            };
        }

        // ✅ CRITICAL SECURITY FIX: Store session_key on server, NEVER send to client
        const db = uniCloud.database();

        // Store session_key in database (server-side only)
        await db.collection('user_sessions').doc(openid).set({
            openid: openid,
            session_key: session_key, // Keep on server only
            unionid: unionid || null,
            updateTime: Date.now()
        });

        console.log('Session stored for openid:', openid);

        // ✅ ONLY return openid and unionid to client
        // ❌ NEVER return session_key
        return {
            code: 0,
            openid: openid,
            unionid: unionid || null
            // session_key is NOT included - stored on server only
        };

    } catch (error) {
        console.error('Login error:', error);
        return {
            code: -1,
            message: 'Login failed',
            error: error.message
        };
    }
};