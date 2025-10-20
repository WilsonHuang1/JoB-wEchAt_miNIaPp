<template>
    <view class="login-container">
        <view class="login-box">
            <text class="login-title">管理后台登录</text>

            <text class="hint-text">点击下方按钮直接登录（开发模式）</text>

            <button class="btn-login" @click="devLogin">开发者直接登录</button>

            <view class="demo-hint">
                <text>正式环境将使用用户名密码登录</text>
            </view>
        </view>
    </view>
</template>

<script>
    export default {
        data() {
            return {};
        },

        methods: {
            devLogin() {
                // Generate a fake token for development
                const fakeToken = 'dev_token_' + Date.now();
                const fakeUser = {
                    username: 'admin',
                    name: '管理员',
                    role: 'admin'
                };

                uni.setStorageSync('adminToken', fakeToken);
                uni.setStorageSync('adminUser', fakeUser);

                uni.showToast({
                    title: '登录成功',
                    icon: 'success'
                });

                setTimeout(() => {
                    uni.redirectTo({
                        url: '/pages/admin/records'
                    });
                }, 500);
            }
        }
    };
</script>

<style lang="scss">
    .login-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .login-box {
        width: 90%;
        max-width: 400px;
        padding: 40px 30px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .login-title {
        display: block;
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        color: #333;
        margin-bottom: 20px;
    }

    .hint-text {
        display: block;
        text-align: center;
        color: #666;
        margin-bottom: 30px;
        font-size: 14px;
    }

    .btn-login {
        width: 100%;
        padding: 15px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
    }

    .demo-hint {
        margin-top: 20px;
        padding: 10px;
        background: #e7f3ff;
        border-radius: 4px;
        text-align: center;
        color: #0066cc;
        font-size: 12px;
    }
</style>