<template>
    <view class="admin-container">
        <view class="header">
            <text class="title">踏勘记录管理</text>
            <view class="header-actions">
                <button class="btn-refresh" @click="loadRecords">🔄 刷新</button>
                <button class="btn-logout" @click="logout">登出</button>
            </view>
        </view>

        <!-- Filters -->
        <view class="filters">
            <input class="filter-input" v-model="searchQuery" placeholder="搜索名称、地点、公司..." @input="filterRecords" />
            <picker @change="onDateChange" mode="date">
                <view class="date-picker">
                    <text>{{ selectedDate || '选择日期' }}</text>
                </view>
            </picker>
        </view>

        <!-- Records Table -->
        <view class="table-container">
            <view class="table-header">
                <text class="col-name">项目名称</text>
                <text class="col-location">地点</text>
                <text class="col-person">踏勘人员</text>
                <text class="col-date">创建日期</text>
                <text class="col-actions">操作</text>
            </view>

            <view class="table-body">
                <view class="table-row" v-for="record in filteredRecords" :key="record._id">
                    <text class="col-name">{{ record.mingcheng }}</text>
                    <text class="col-location">{{ record.didian }}</text>
                    <text class="col-person">{{ record.tankanyuan }}</text>
                    <text class="col-date">{{ formatDate(record.createTime) }}</text>
                    <view class="col-actions">
                        <button class="btn-view" @click="viewDetails(record)">查看</button>
                        <button class="btn-download" @click="downloadReport(record._id)">下载报告</button>
                    </view>
                </view>
            </view>
        </view>

        <!-- Detail Modal -->
        <view class="modal" v-if="showModal" @click="closeModal">
            <view class="modal-content" @click.stop>
                <view class="modal-header">
                    <text class="modal-title">{{ selectedRecord.mingcheng }}</text>
                    <text class="modal-close" @click="closeModal">×</text>
                </view>
                <view class="modal-body">
                    <view class="detail-section">
                        <text class="section-title">基本信息</text>
                        <view class="detail-item">
                            <text class="label">归属公司:</text>
                            <text class="value">{{ selectedRecord.guishu }}</text>
                        </view>
                        <view class="detail-item">
                            <text class="label">踏勘人员:</text>
                            <text class="value">{{ selectedRecord.tankanyuan }}</text>
                        </view>
                        <view class="detail-item">
                            <text class="label">地点:</text>
                            <text class="value">{{ selectedRecord.didian }}</text>
                        </view>
                        <view class="detail-item">
                            <text class="label">创建时间:</text>
                            <text class="value">{{ formatDateTime(selectedRecord.createTime) }}</text>
                        </view>
                    </view>

                    <view class="detail-section" v-if="selectedRecord.environmentData">
                        <text class="section-title">环境信息</text>
                        <view class="detail-item" v-for="(value, key) in selectedRecord.environmentData" :key="key">
                            <text class="label">{{ getEnvLabel(key) }}:</text>
                            <text class="value">{{ value || '-' }}</text>
                        </view>
                    </view>

                    <view class="detail-section"
                        v-if="selectedRecord.qingxifanwei && selectedRecord.qingxifanwei.length > 0">
                        <text class="section-title">清洗范围 ({{ selectedRecord.qingxifanwei.length }}项)</text>
                        <view class="cleaning-item" v-for="(item, index) in selectedRecord.qingxifanwei" :key="index">
                            <text class="item-type">{{ index + 1 }}. {{ item.type }}</text>
                            <view class="item-details">
                                <text>型号: {{ item.specs?.model || '-' }}</text>
                                <text>数量: {{ item.specs?.quantity || '-' }} {{ item.specs?.unit || '' }}</text>
                                <text>频次: {{ item.specs?.frequency || '-' }}</text>
                                <text v-if="item.specs?.position">位置: {{ item.specs.position }}</text>
                            </view>

                            <!-- Add photos display -->
                            <view class="item-photos"
                                v-if="item.specs?.photoBefore && item.specs.photoBefore.length > 0">
                                <text class="photos-label">清洗前照片 ({{ item.specs.photoBefore.length }}张):</text>
                                <view class="photos-grid">
                                    <image v-for="(photo, photoIndex) in item.specs.photoBefore" :key="photoIndex"
                                        :src="photo" class="photo-thumbnail" mode="aspectFill"
                                        @click="previewImage(item.specs.photoBefore, photoIndex)" />
                                </view>
                            </view>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <view class="loading" v-if="loading">
            <text>加载中...</text>
        </view>
    </view>
</template>

<script>
    export default {
        data() {
            return {
                records: [],
                filteredRecords: [],
                searchQuery: '',
                selectedDate: '',
                loading: false,
                showModal: false,
                selectedRecord: {}
            };
        },

        onLoad() {
            // Check authentication
            const adminToken = uni.getStorageSync('adminToken');
            if (!adminToken) {
                uni.redirectTo({
                    url: '/pages/admin/login'
                });
                return;
            }

            this.loadRecords();
        },

        methods: {
            async loadRecords() {
                this.loading = true;
                try {
                    console.log('🔍 Starting to load records...');

                    const db = uniCloud.database();
                    const result = await db.collection('tankan_records')
                        .orderBy('createTime', 'desc')
                        .get();

                    console.log('📦 Full result:', result);

                    // The data is in result.result.data, not result.data
                    const data = result.result?.data || result.data;

                    console.log('📊 Extracted data:', data);
                    console.log('📏 Data length:', data ? data.length : 'undefined');

                    if (data && data.length > 0) {
                        this.records = data;
                        this.filteredRecords = data;

                        console.log('✅ Records loaded:', this.records.length);

                        uni.showToast({
                            title: `加载了 ${data.length} 条记录`,
                            icon: 'success'
                        });
                    } else {
                        this.records = [];
                        this.filteredRecords = [];

                        uni.showToast({
                            title: '暂无记录',
                            icon: 'none'
                        });
                    }
                } catch (error) {
                    console.error('❌ 加载记录失败:', error);

                    this.records = [];
                    this.filteredRecords = [];

                    uni.showToast({
                        title: '加载失败: ' + error.message,
                        icon: 'none'
                    });
                } finally {
                    this.loading = false;
                }
            },

            filterRecords() {
                const query = this.searchQuery.toLowerCase();
                this.filteredRecords = this.records.filter(record => {
                    return (
                        record.mingcheng?.toLowerCase().includes(query) ||
                        record.didian?.toLowerCase().includes(query) ||
                        record.guishu?.toLowerCase().includes(query) ||
                        record.tankanyuan?.toLowerCase().includes(query)
                    );
                });
            },

            previewImage(photos, current) {
                uni.previewImage({
                    urls: photos,
                    current: current
                });
            },

            onDateChange(e) {
                this.selectedDate = e.detail.value;
                const selectedTimestamp = new Date(this.selectedDate).getTime();

                this.filteredRecords = this.records.filter(record => {
                    const recordDate = new Date(record.createTime).toDateString();
                    const selectedDateStr = new Date(selectedTimestamp).toDateString();
                    return recordDate === selectedDateStr;
                });
            },

            viewDetails(record) {
                this.selectedRecord = record;
                this.showModal = true;
            },

            closeModal() {
                this.showModal = false;
            },

            async downloadReport(recordId) {
                uni.showLoading({
                    title: '生成报告中...'
                });

                try {
                    const result = await uniCloud.callFunction({
                        name: 'generate-report',
                        data: {
                            recordId: recordId,
                            recordType: 'tankan'
                        }
                    });

                    if (result.result.code === 200) {
                        const fileID = result.result.data.fileID;

                        // Get download URL
                        const tempFileRes = await uniCloud.getTempFileURL({
                            fileList: [fileID]
                        });

                        if (tempFileRes.fileList && tempFileRes.fileList.length > 0) {
                            const downloadUrl = tempFileRes.fileList[0].tempFileURL;

                            // For H5/Web, create download link
                            // #ifdef H5
                            const link = document.createElement('a');
                            link.href = downloadUrl;
                            link.download = result.result.data.fileName;
                            link.click();
                            // #endif

                            // For App/MiniProgram
                            // #ifndef H5
                            uni.downloadFile({
                                url: downloadUrl,
                                success: (res) => {
                                    uni.openDocument({
                                        filePath: res.tempFilePath,
                                        showMenu: true
                                    });
                                }
                            });
                            // #endif

                            uni.hideLoading();
                            uni.showToast({
                                title: '报告下载成功',
                                icon: 'success'
                            });
                        }
                    } else {
                        throw new Error(result.result.message);
                    }
                } catch (error) {
                    uni.hideLoading();
                    console.error('下载报告失败:', error);
                    uni.showToast({
                        title: '下载失败: ' + error.message,
                        icon: 'none'
                    });
                }
            },

            formatDate(timestamp) {
                const date = new Date(timestamp);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            },

            formatDateTime(timestamp) {
                const date = new Date(timestamp);
                return date.toLocaleString('zh-CN');
            },

            getEnvLabel(key) {
                const labels = {
                    parkingEntrance: '停车场入口',
                    recommendedParking: '建议停车位',
                    elevatorEntrance: '电梯入口',
                    recommendedRoute: '建议路线',
                    rooftopEnvironment: '楼顶环境',
                    waterElectricity: '取水电情况',
                    otherConditions: '其他情况'
                };
                return labels[key] || key;
            },

            logout() {
                uni.showModal({
                    title: '确认登出',
                    content: '确定要退出登录吗？',
                    success: (res) => {
                        if (res.confirm) {
                            uni.removeStorageSync('adminToken');
                            uni.removeStorageSync('adminUser');
                            uni.redirectTo({
                                url: '/pages/admin/login'
                            });
                        }
                    }
                });
            }
        }
    };
</script>

<style lang="scss">
    .admin-container {
        min-height: 100vh;
        background: #f5f5f5;
        padding: 20rpx;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 30rpx;
        background: white;
        border-radius: 16rpx;
        margin-bottom: 20rpx;
    }

    .title {
        font-size: 40rpx;
        font-weight: bold;
        color: #333;
    }

    .btn-refresh {
        padding: 20rpx 30rpx;
        background: #007AFF;
        color: white;
        border: none;
        border-radius: 8rpx;
    }

    .filters {
        display: flex;
        gap: 20rpx;
        padding: 20rpx;
        background: white;
        border-radius: 16rpx;
        margin-bottom: 20rpx;
    }

    .filter-input {
        flex: 1;
        padding: 20rpx;
        border: 2rpx solid #e5e5e5;
        border-radius: 8rpx;
    }

    .date-picker {
        padding: 20rpx 30rpx;
        border: 2rpx solid #e5e5e5;
        border-radius: 8rpx;
        background: white;
    }

    .table-container {
        background: white;
        border-radius: 16rpx;
        overflow: hidden;
    }

    .table-header {
        display: flex;
        padding: 20rpx;
        background: #f8f9fa;
        font-weight: bold;
        border-bottom: 2rpx solid #e5e5e5;
    }

    .table-body {
        max-height: 1000rpx;
        overflow-y: auto;
    }

    .table-row {
        display: flex;
        padding: 20rpx;
        border-bottom: 1rpx solid #f0f0f0;

        &:hover {
            background: #f8f9fa;
        }
    }

    .col-name {
        flex: 2;
    }

    .col-location {
        flex: 2;
    }

    .col-person {
        flex: 1.5;
    }

    .col-date {
        flex: 1.5;
    }

    .col-actions {
        flex: 2;
        display: flex;
        gap: 10rpx;
    }

    .btn-view,
    .btn-download {
        padding: 10rpx 20rpx;
        border: none;
        border-radius: 6rpx;
        font-size: 24rpx;
    }

    .btn-view {
        background: #17a2b8;
        color: white;
    }

    .btn-download {
        background: #28a745;
        color: white;
    }

    .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }

    .modal-content {
        width: 80%;
        max-height: 80%;
        background: white;
        border-radius: 16rpx;
        overflow: hidden;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 30rpx;
        background: #007AFF;
        color: white;
    }

    .modal-title {
        font-size: 36rpx;
        font-weight: bold;
    }

    .modal-close {
        font-size: 60rpx;
        cursor: pointer;
    }

    .modal-body {
        padding: 30rpx;
        max-height: 800rpx;
        overflow-y: auto;
    }

    .detail-section {
        margin-bottom: 30rpx;
    }

    .section-title {
        display: block;
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 20rpx;
        padding-bottom: 10rpx;
        border-bottom: 2rpx solid #e5e5e5;
    }

    .detail-item {
        display: flex;
        padding: 15rpx 0;

        .label {
            min-width: 200rpx;
            color: #666;
            font-weight: 500;
        }

        .value {
            flex: 1;
            color: #333;
        }
    }

    .cleaning-item {
        padding: 20rpx;
        background: #f8f9fa;
        border-radius: 8rpx;
        margin-bottom: 15rpx;
    }

    .item-type {
        display: block;
        font-weight: bold;
        margin-bottom: 10rpx;
    }

    .item-details {
        display: flex;
        flex-direction: column;
        gap: 5rpx;
        font-size: 26rpx;
        color: #666;
    }

    .loading {
        text-align: center;
        padding: 40rpx;
        color: #666;
    }

    .header-actions {
        display: flex;
        gap: 20rpx;
    }

    .btn-logout {
        padding: 20rpx 30rpx;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 8rpx;
    }

    .item-photos {
        margin-top: 15rpx;
        padding-top: 15rpx;
        border-top: 1rpx solid #e5e5e5;
    }

    .photos-label {
        display: block;
        font-size: 26rpx;
        color: #666;
        margin-bottom: 10rpx;
    }

    .photos-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10rpx;
    }

    .photo-thumbnail {
        width: 100%;
        height: 150rpx;
        border-radius: 8rpx;
        cursor: pointer;
        transition: transform 0.2s;

        &:hover {
            transform: scale(1.05);
        }
    }
</style>