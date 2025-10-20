'use strict';
const db = uniCloud.database();
const crypto = require('crypto');

exports.main = async (event, context) => {
    const {
        username,
        password
    } = event;

    if (!username || !password) {
        return {
            code: 400,
            message: '用户名和密码不能为空'
        };
    }

    try {
        // Hash password
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

        // Query admin user
        const adminCollection = db.collection('admin_users');
        const result = await adminCollection.where({
            username: username,
            password: hashedPassword
        }).get();

        if (result.data.length > 0) {
            const user = result.data[0];

            // Generate token (simple version - use JWT in production)
            const token = crypto.randomBytes(32).toString('hex');

            // Update last login
            await adminCollection.doc(user._id).update({
                lastLogin: Date.now(),
                token: token
            });

            return {
                code: 200,
                message: '登录成功',
                data: {
                    token: token,
                    user: {
                        username: user.username,
                        name: user.name,
                        role: user.role
                    }
                }
            };
        } else {
            return {
                code: 401,
                message: '用户名或密码错误'
            };
        }
    } catch (error) {
        console.error('登录失败:', error);
        return {
            code: 500,
            message: '登录失败',
            error: error.message
        };
    }
};