<template>
    <view class="container">
        <!-- Login Page (shows first) -->
        <view class="login-page" v-if="!userInfo.isLoggedIn">
            <view class="app-header">
                <view class="app-icon">🏢</view>
                <text class="app-name">业务管理系统</text>
            </view>
            <view class="login-button-container">
                <button class="employee-login-btn" @click="wechatLogin">员工登录</button>
            </view>
        </view>

        <!-- Main Menu (shows after login) -->
        <view class="main-menu" v-if="userInfo.isLoggedIn">
            <view class="header">
                <text class="title">业务管理系统</text>
            </view>

            <view class="main-tabs">
                <view class="tab-item survey" @click="goToSite">
                    <view class="tab-icon">📋</view>
                    <text class="tab-title">踏勘</text>
                    <text class="tab-desc">现场踏勘信息采集</text>
                </view>

                <view class="tab-item construction" @click="goToConstruction">
                    <view class="tab-icon">🔨</view>
                    <text class="tab-title">施工</text>
                    <text class="tab-desc">施工进度管理</text>
                </view>

                <view class="tab-item business" @click="goToBusiness">
                    <view class="tab-icon">💼</view>
                    <text class="tab-title">营业管理</text>
                    <text class="tab-desc">商户信息管理</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
    export default {
        data() {
            return {
                userInfo: {
                    name: '',
                    company: '',
                    isLoggedIn: false
                }
            };
        },
        methods: {
            // Demo user data - replace with real API call later
            getDemoUserData(openid) {
                const demoUsers = {
                    'demo_user_1': {
                        name: '张三',
                        company: '北京建筑公司'
                    },
                    'demo_user_2': {
                        name: '李四',
                        company: '上海工程集团'
                    },
                    'demo_user_3': {
                        name: '王五',
                        company: '广州施工有限公司'
                    }
                };
                return demoUsers[openid] || {
                    name: '测试用户',
                    company: '演示公司'
                };
            },

            // WeChat login
            wechatLogin() {
                uni.login({
                    provider: 'weixin',
                    success: (loginRes) => {
                        console.log('微信登录成功', loginRes.code);
                        const demoOpenId = 'demo_user_' + Math.floor(Math.random() * 3 + 1);
                        const userData = this.getDemoUserData(demoOpenId);

                        this.userInfo.name = userData.name;
                        this.userInfo.company = userData.company;
                        this.userInfo.isLoggedIn = true;

                        uni.showToast({
                            title: `欢迎 ${userData.name}`,
                            icon: 'success'
                        });
                    },
                    fail: (err) => {
                        console.log('微信登录失败', err);
                        uni.showToast({
                            title: '登录失败，使用演示模式',
                            icon: 'none'
                        });
                        const userData = this.getDemoUserData('demo_user_1');
                        this.userInfo.name = userData.name;
                        this.userInfo.company = userData.company;
                        this.userInfo.isLoggedIn = true;
                    }
                });
            },

            goToSite() {
                uni.navigateTo({
                    url: '/pages/site/index',
                    success: () => {
                        uni.setStorageSync('userInfo', this.userInfo);
                    }
                });
            },

            goToConstruction() {
                uni.navigateTo({
                    url: '/pages/construction/index',
                    success: () => {
                        uni.setStorageSync('userInfo', this.userInfo);
                    }
                });
            },

            goToBusiness() {
                uni.navigateTo({
                    url: '/pages/business/index',
                    success: () => {
                        uni.setStorageSync('userInfo', this.userInfo);
                    }
                });
            },

            goToTest() {
                uni.navigateTo({
                    url: '/pages/test/test'
                });
            }
        }
    };
</script>

<style lang="scss">
    .container {
        padding: 20rpx;
        background-color: #f5f5f5;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }

    // Login page styles
    .login-page {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .app-header {
        text-align: center;
        margin-bottom: 100rpx;
    }

    .app-icon {
        font-size: 120rpx;
        margin-bottom: 30rpx;
    }

    .app-name {
        font-size: 48rpx;
        color: white;
        font-weight: bold;
    }

    .login-button-container {
        width: 100%;
        padding: 0 60rpx;
    }

    .employee-login-btn {
        width: 100%;
        padding: 30rpx;
        background-color: white;
        color: #333;
        border: none;
        border-radius: 50rpx;
        font-size: 32rpx;
        font-weight: bold;

        &:active {
            background-color: #f0f0f0;
        }
    }

    // Main menu styles
    .main-menu {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .header {
        text-align: center;
        padding: 40rpx 0 60rpx 0;

        .title {
            font-size: 48rpx;
            font-weight: bold;
            color: #333;
        }
    }

    .main-tabs {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 40rpx;
        padding: 0 40rpx;
    }

    .tab-item {
        background: white;
        border-radius: 24rpx;
        padding: 80rpx 40rpx;
        box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        transition: all 0.3s ease;
        min-height: 300rpx;
        justify-content: center;

        &:active {
            transform: scale(0.98);
            box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.15);
        }
    }

    .tab-icon {
        font-size: 120rpx;
        margin-bottom: 30rpx;
    }

    .tab-title {
        font-size: 48rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 20rpx;
    }

    .tab-desc {
        font-size: 28rpx;
        color: #666;
        line-height: 1.4;
    }

    .survey {
        border-left: 12rpx solid #34C759;
    }

    .construction {
        border-left: 12rpx solid #FF9500;
    }

    .business {
        border-left: 12rpx solid #007AFF;
    }
</style>