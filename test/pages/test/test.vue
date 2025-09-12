<template>
    <view class="container">
        <view class="title">Job Miniapp Functions Test</view>

        <button class="test-btn" @click="testUserAuth">Test User Auth</button>
        <button class="test-btn" @click="testCreateJob">Test Create Job</button>
        <button class="test-btn" @click="testGetJobs">Test Get Jobs</button>

        <view class="result-container">
            <text class="result-text">{{ result }}</text>
        </view>
    </view>
</template>

<script>
    export default {
        data() {
            return {
                result: 'Choose a function to test'
            }
        },
        methods: {
            async testUserAuth() {
                try {
                    const res = await uniCloud.callFunction({
                        name: 'userAuth',
                        data: {
                            action: 'register',
                            userInfo: {
                                openId: 'test-openid-123',
                                nickName: 'Test User',
                                avatarUrl: 'https://example.com/avatar.jpg'
                            }
                        }
                    })
                    this.result = JSON.stringify(res.result, null, 2)
                } catch (error) {
                    this.result = `Error: ${error.message}`
                }
            },

            async testCreateJob() {
                try {
                    const res = await uniCloud.callFunction({
                        name: 'jobManager',
                        data: {
                            action: 'createJob',
                            jobData: {
                                title: 'Frontend Developer',
                                company: 'Tech Corp',
                                city: 'Beijing',
                                salary: '15K-25K',
                                jobType: 'fulltime',
                                description: 'Looking for experienced frontend developer...'
                            }
                        }
                    })
                    this.result = JSON.stringify(res.result, null, 2)
                } catch (error) {
                    this.result = `Error: ${error.message}`
                }
            },

            async testGetJobs() {
                try {
                    const res = await uniCloud.callFunction({
                        name: 'jobManager',
                        data: {
                            action: 'getJobs',
                            filters: {}
                        }
                    })
                    this.result = JSON.stringify(res.result, null, 2)
                } catch (error) {
                    this.result = `Error: ${error.message}`
                }
            }
        }
    }
</script>