<template>
    <view class="container">
        <view class="header">
            <text class="title">踏勘信息确认</text>
        </view>

        <scroll-view class="content" scroll-y v-if="summaryData.基本信息">
            <!-- Basic Info -->
            <view class="summary-section">
                <text class="section-header">基本信息</text>
                <view class="info-grid">
                    <view class="info-item" v-for="(value, key) in summaryData.基本信息" :key="key">
                        <text class="info-label">{{key}}:</text>
                        <text class="info-value">{{value}}</text>
                    </view>
                </view>
            </view>

            <!-- Statistics -->
            <view class="summary-section">
                <text class="section-header">清洗范围统计</text>
                <view class="stats-grid">
                    <view class="stat-item" v-for="(value, key) in summaryData.清洗范围统计" :key="key">
                        <text class="stat-type">{{key}}</text>
                        <text class="stat-count">{{value}}</text>
                    </view>
                </view>
            </view>

            <!-- Totals -->
            <view class="summary-section">
                <text class="section-header">汇总统计</text>
                <view class="totals-grid">
                    <view class="total-item" v-for="(value, key) in summaryData.总计" :key="key">
                        <text class="total-label">{{key}}:</text>
                        <text class="total-value">{{value}}</text>
                    </view>
                </view>
            </view>

            <!-- Detailed Items -->
            <view class="summary-section">
                <text class="section-header">详细条目 ({{summaryData.详细条目 ? summaryData.详细条目.length : 0}}项)</text>
                <view class="details-list">
                    <view class="detail-item" v-for="(item, index) in summaryData.详细条目" :key="index">
                        <view class="detail-header">
                            <text class="detail-type">{{item.类型}}</text>
                        </view>
                        <view class="detail-info">
                            <text class="detail-text" v-if="item.材质">材质: {{item.材质}}</text>
                            <text class="detail-text" v-if="item.位置 && item.位置 !== '-'">位置: {{item.位置}}</text>
                            <text class="detail-text" v-if="item.规格 && item.规格 !== '-'">规格: {{item.规格}}</text>
                            <text class="detail-text">数量: {{item.数量}}</text>
                            <text class="detail-text">频次: {{item.频次}}</text>
                            <text class="detail-text">照片: {{item.照片}}</text>
                        </view>
                    </view>
                </view>
            </view>
        </scroll-view>

        <view v-else class="loading">
            <text>加载中...</text>
        </view>

        <view class="footer">
            <button class="btn-back" @click="goBack">返回修改</button>
            <button class="btn-confirm" @click="confirmSave">确认保存</button>
        </view>
    </view>
</template>

<script>
    const db = uniCloud.database()

    export default {
        data() {
            return {
                summaryData: {
                    基本信息: {},
                    清洗范围统计: {},
                    详细条目: [],
                    总计: {}
                },
                formData: {},
                specDetails: {},
                multipleEntries: {},
                currentLocation: null,
                userInfo: {}
            }
        },

        onLoad() {
            // Get data passed from previous page
            const eventChannel = this.getOpenerEventChannel()
            eventChannel.on('previewData', (data) => {
                this.summaryData = data.summaryData
                this.formData = data.formData
                this.specDetails = data.specDetails
                this.multipleEntries = data.multipleEntries
                this.currentLocation = data.currentLocation
                this.userInfo = data.userInfo
            })
        },

        methods: {
            goBack() {
                uni.navigateBack()
            },

            async confirmSave() {
                try {
                    uni.showLoading({
                        title: '保存中...'
                    })

                    const record = {
                        guishu: this.formData.guishu,
                        tankanyuan: this.formData.tankanyuan,
                        didian: this.formData.didian,
                        mingcheng: this.formData.mingcheng,
                        qingxifanwei: this.formData.qingxifanwei,
                        specDetails: this.specDetails,
                        multipleEntries: this.multipleEntries,
                        summaryData: this.summaryData,
                        location: this.currentLocation,
                        userId: this.userInfo.userId,
                        status: 'draft'
                    }

                    const result = await db.collection('tankan_records').add(record)
                    uni.hideLoading()
                    uni.showToast({
                        title: '保存成功',
                        icon: 'success'
                    })

                    setTimeout(() => {
                        uni.navigateBack({
                            delta: 2
                        }) // Go back 2 pages to main form
                    }, 1500)

                } catch (error) {
                    uni.hideLoading()
                    console.error('保存失败:', error)
                    uni.showToast({
                        title: '保存失败: ' + error.message,
                        icon: 'error'
                    })
                }
            }
        }
    }
</script>

<style lang="scss">
    .container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: #f5f6fa;
    }

    .header {
        background: linear-gradient(135deg, #007AFF, #0056D6);
        padding: 60rpx 30rpx 30rpx 30rpx;
        color: white;

        .title {
            font-size: 40rpx;
            font-weight: bold;
            text-align: center;
        }
    }

    .content {
        flex: 1;
        padding: 20rpx;
    }

    .summary-section {
        background: white;
        border-radius: 16rpx;
        margin-bottom: 20rpx;
        overflow: hidden;
        box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
    }

    .section-header {
        font-size: 32rpx;
        font-weight: bold;
        color: white;
        background: linear-gradient(135deg, #007AFF, #0056D6);
        padding: 25rpx 30rpx;
        display: block;
    }

    .info-grid,
    .stats-grid,
    .totals-grid {
        padding: 30rpx;
        display: flex;
        flex-direction: column;
        gap: 15rpx;
    }

    .info-item,
    .total-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20rpx;
        background: #f8f9fa;
        border-radius: 12rpx;
        border-left: 6rpx solid #007AFF;
    }

    .info-label,
    .total-label {
        font-size: 28rpx;
        color: #6c757d;
        font-weight: 500;
    }

    .info-value,
    .total-value {
        font-size: 28rpx;
        color: #333;
        font-weight: bold;
        text-align: right;
        max-width: 60%;
    }

    .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 25rpx 30rpx;
        border-bottom: 1rpx solid #f0f0f0;

        &:last-child {
            border-bottom: none;
        }
    }

    .stat-type {
        font-size: 30rpx;
        color: #333;
        font-weight: bold;
    }

    .stat-count {
        font-size: 28rpx;
        color: #007AFF;
        font-weight: bold;
    }

    .details-list {
        padding: 30rpx;
        display: flex;
        flex-direction: column;
        gap: 20rpx;
    }

    .detail-item {
        border: 2rpx solid #e9ecef;
        border-radius: 12rpx;
        overflow: hidden;
        background: white;
    }

    .detail-header {
        background: linear-gradient(135deg, #e3f2fd, #bbdefb);
        padding: 20rpx 25rpx;
    }

    .detail-type {
        font-size: 28rpx;
        font-weight: bold;
        color: #1976d2;
    }

    .detail-info {
        padding: 25rpx;
        display: flex;
        flex-direction: column;
        gap: 12rpx;
    }

    .detail-text {
        font-size: 26rpx;
        color: #495057;
        line-height: 1.4;

        &:first-child {
            font-weight: 500;
            color: #333;
        }
    }

    .footer {
        display: flex;
        gap: 30rpx;
        padding: 30rpx;
        background: white;
        border-top: 1rpx solid #e9ecef;
        box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.1);
    }

    .btn-back,
    .btn-confirm {
        flex: 1;
        height: 88rpx;
        border-radius: 16rpx;
        font-size: 32rpx;
        font-weight: bold;
        border: none;
        transition: all 0.3s ease;
    }

    .btn-back {
        background: linear-gradient(135deg, #6c757d, #5a6268);
        color: white;

        &:active {
            transform: scale(0.98);
            background: linear-gradient(135deg, #5a6268, #495057);
        }
    }

    .btn-confirm {
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;

        &:active {
            transform: scale(0.98);
            background: linear-gradient(135deg, #218838, #1ea67a);
        }
    }
</style>