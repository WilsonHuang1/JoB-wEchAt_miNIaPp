<template>
    <view class="container">
        <view class="form-section">
            <view class="section-title">商业外观基础信息</view>

            <view class="form-group">
                <text class="label">位置</text>
                <input class="input" v-model="formData.location" placeholder="请输入位置信息" />
            </view>

            <view class="form-group">
                <text class="label">名称</text>
                <input class="input" v-model="formData.name" placeholder="请输入名称" />
            </view>

            <view class="form-group">
                <text class="label">外观描述</text>
                <textarea class="textarea" v-model="formData.appearance" placeholder="请描述外观情况" />
            </view>

            <view class="form-group">
                <text class="label">停车场入口</text>
                <input class="input" v-model="formData.parkingEntrance" placeholder="停车场入口位置" />
            </view>

            <view class="form-group">
                <text class="label">价格</text>
                <input class="input" type="number" v-model="formData.price" placeholder="请输入价格" />
            </view>

            <view class="form-group">
                <text class="label">停车反应</text>
                <picker @change="onParkingReactionChange" :value="parkingReactionIndex" :range="parkingReactions">
                    <view class="picker">
                        {{parkingReactions[parkingReactionIndex]}}
                    </view>
                </picker>
            </view>

            <view class="form-group">
                <text class="label">口碑评价</text>
                <textarea class="textarea" v-model="formData.reputation" placeholder="提供口碑评价信息" />
            </view>

            <view class="button-group">
                <button class="btn-save" @click="saveData">保存</button>
                <button class="btn-cancel" @click="goBack">返回</button>
            </view>
        </view>
    </view>
</template>

<script>
    export default {
        data() {
            return {
                formData: {
                    location: '',
                    name: '',
                    appearance: '',
                    parkingEntrance: '',
                    price: '',
                    parkingReaction: '',
                    reputation: ''
                },
                parkingReactions: ['良好', '一般', '较差', '无停车位'],
                parkingReactionIndex: 0
            }
        },
        methods: {
            onParkingReactionChange(e) {
                this.parkingReactionIndex = e.detail.value;
                this.formData.parkingReaction = this.parkingReactions[e.detail.value];
            },

            async saveData() {
                // Validation
                if (!this.formData.name.trim()) {
                    uni.showToast({
                        title: '请填写名称',
                        icon: 'none'
                    });
                    return;
                }

                if (!this.formData.location.trim()) {
                    uni.showToast({
                        title: '请填写位置',
                        icon: 'none'
                    });
                    return;
                }

                try {
                    uni.showLoading({
                        title: '保存中...'
                    });

                    const db = uniCloud.database();

                    const record = {
                        name: this.formData.name,
                        location: this.formData.location,
                        appearance: this.formData.appearance,
                        parkingEntrance: this.formData.parkingEntrance,
                        parkingPrice: this.formData.price,
                        parkingReaction: this.formData.parkingReaction,
                        reputation: this.formData.reputation,
                        userId: uni.getStorageSync('userId') || 'temp_user',
                        isActive: true
                    };

                    const result = await db.collection('business_info').add(record);

                    uni.hideLoading();
                    uni.showToast({
                        title: '保存成功',
                        icon: 'success'
                    });

                    setTimeout(() => {
                        uni.navigateBack();
                    }, 1500);

                } catch (error) {
                    uni.hideLoading();
                    console.error('保存失败:', error);
                    uni.showToast({
                        title: '保存失败: ' + error.message,
                        icon: 'none'
                    });
                }
            },

            goBack() {
                uni.navigateBack();
            }
        },
        onLoad() {
            // 加载已保存的数据
            const savedData = uni.getStorageSync('businessBasicInfo');
            if (savedData) {
                this.formData = savedData;
                // 设置picker的选中状态
                const index = this.parkingReactions.indexOf(savedData.parkingReaction);
                if (index !== -1) {
                    this.parkingReactionIndex = index;
                }
            }
        }
    }
</script>

<style lang="scss">
    .container {
        padding: 20rpx;
        background-color: #f5f5f5;
        min-height: 100vh;
    }

    .form-section {
        background: white;
        border-radius: 16rpx;
        padding: 30rpx;
        margin-bottom: 20rpx;
    }

    .section-title {
        font-size: 36rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 30rpx;
        text-align: center;
    }

    .form-group {
        margin-bottom: 30rpx;
    }

    .label {
        display: block;
        font-size: 28rpx;
        color: #333;
        margin-bottom: 10rpx;
        font-weight: 500;
    }

    .input,
    .textarea {
        width: 100%;
        padding: 20rpx;
        border: 2rpx solid #e5e5e5;
        border-radius: 12rpx;
        font-size: 28rpx;
        background-color: #fafafa;

        &:focus {
            border-color: #007AFF;
            background-color: white;
        }
    }

    .textarea {
        min-height: 120rpx;
        resize: none;
    }

    .picker {
        padding: 20rpx;
        border: 2rpx solid #e5e5e5;
        border-radius: 12rpx;
        background-color: #fafafa;
        font-size: 28rpx;
        color: #333;
    }

    .button-group {
        display: flex;
        gap: 20rpx;
        margin-top: 40rpx;
    }

    .btn-save,
    .btn-cancel {
        flex: 1;
        padding: 24rpx 0;
        border-radius: 12rpx;
        font-size: 32rpx;
        border: none;
    }

    .btn-save {
        background-color: #007AFF;
        color: white;

        &:active {
            background-color: #0066CC;
        }
    }

    .btn-cancel {
        background-color: #f0f0f0;
        color: #666;

        &:active {
            background-color: #e0e0e0;
        }
    }
</style>