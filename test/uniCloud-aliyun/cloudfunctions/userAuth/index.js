// uniCloud-aliyun/cloudfunctions/userAuth/index.js
'use strict';
const db = uniCloud.database()

exports.main = async (event, context) => {
    const {
        action,
        userInfo
    } = event

    switch (action) {
        case 'login':
            return await loginUser(userInfo)
        case 'register':
            return await registerUser(userInfo)
        case 'getUserInfo':
            return await getUserInfo(context.OPENID)
        default:
            return {
                code: -1, message: 'Invalid action'
            }
    }
}

async function loginUser(userInfo) {
    try {
        // Check if user exists
        const userCollection = db.collection('users')
        const existingUser = await userCollection.where({
            openid: userInfo.openId
        }).get()

        if (existingUser.data.length > 0) {
            // User exists, update login time
            await userCollection.doc(existingUser.data[0]._id).update({
                lastLogin: Date.now()
            })
            return {
                code: 0,
                message: 'Login successful',
                data: existingUser.data[0]
            }
        } else {
            // New user, register automatically
            return await registerUser(userInfo)
        }
    } catch (error) {
        return {
            code: -1,
            message: 'Login failed',
            error: error.message
        }
    }
}

async function registerUser(userInfo) {
    try {
        const userCollection = db.collection('users')
        const newUser = await userCollection.add({
            openid: userInfo.openId,
            nickName: userInfo.nickName,
            avatarUrl: userInfo.avatarUrl,
            createdAt: Date.now(),
            lastLogin: Date.now(),
            profile: {
                phone: '',
                email: '',
                resume: '',
                skills: []
            }
        })

        return {
            code: 0,
            message: 'Registration successful',
            data: {
                _id: newUser.id,
                ...userInfo
            }
        }
    } catch (error) {
        return {
            code: -1,
            message: 'Registration failed',
            error: error.message
        }
    }
}

async function getUserInfo(openid) {
    try {
        const userCollection = db.collection('users')
        const user = await userCollection.where({
            openid
        }).get()

        if (user.data.length > 0) {
            return {
                code: 0,
                message: 'User found',
                data: user.data[0]
            }
        } else {
            return {
                code: -1,
                message: 'User not found'
            }
        }
    } catch (error) {
        return {
            code: -1,
            message: 'Get user info failed',
            error: error.message
        }
    }
}