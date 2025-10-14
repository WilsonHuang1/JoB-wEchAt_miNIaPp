'use strict';
const db = uniCloud.database()
exports.main = async (event, context) => {
    const {
        openid
    } = event

    // Find user by openid
    const userRes = await db.collection('uni-id-users').where({
        openid: openid
    }).get()

    if (userRes.data.length > 0) {
        // User exists, return user data
        return userRes.data[0]
    } else {
        // New user, create with default values
        await db.collection('uni-id-users').add({
            openid: openid,
            name: '新用户',
            company: '待分配'
        })

        return {
            openid: openid,
            name: '新用户',
            company: '待分配'
        }
    }
}