<template>
    <view class="container">
        <view class="form-section">
            <view class="section-title">踏勘信息</view>

            <!-- Login status indicator -->
            <view class="login-status">
                <text class="status-text">已登录: {{userInfo.name}} ({{userInfo.company}})</text>
            </view>

            <!-- Step indicator -->
            <view class="step-indicator">
                <view class="step"
                    :class="{ active: currentStep === 'preparation', completed: isStepCompleted('preparation') }"
                    @click="goToStep('preparation')">1. 准备</view>
                <view class="step"
                    :class="{ active: currentStep === 'environment', completed: isStepCompleted('environment') }"
                    @click="goToStep('environment')">2. 环境信息</view>
                <view class="step"
                    :class="{ active: currentStep === 'inspection', completed: isStepCompleted('inspection') }"
                    @click="goToStep('inspection')">3. 踏勘</view>
                <view class="step"
                    :class="{ active: currentStep === 'completion', completed: isStepCompleted('completion') }"
                    @click="goToStep('completion')">4. 完成</view>

                <!-- Progress bar animation -->
                <view class="progress-bar">
                    <view class="progress-fill" :style="{ width: progressWidth }"></view>
                </view>
            </view>

            <!-- Preparation Step -->
            <view v-if="currentStep === 'preparation'">
                <view class="form-group">
                    <text class="label">归属</text>
                    <input class="input" v-model="formData.guishu" placeholder="请输入归属公司" />
                </view>

                <view class="form-group">
                    <text class="label">踏勘人员</text>
                    <input class="input" v-model="formData.tankanyuan" placeholder="请输入踏勘人员姓名" />
                </view>

                <view class="form-group">
                    <text class="label">地点</text>
                    <view class="location-wrapper">
                        <input class="input location-input" v-model="formData.didian" placeholder="点击获取位置" readonly />
                        <button class="location-btn" @click="getLocation">📍</button>
                    </view>
                </view>

                <view class="form-group">
                    <text class="label">名称</text>
                    <input class="input" v-model="formData.mingcheng" placeholder="请输入名称" />
                </view>

                <view class="button-group">
                    <button class="btn-save" @click="proceedToEnvironment">下一步：环境信息</button>
                </view>
            </view>

            <!-- Environment Information Step -->
            <view v-if="currentStep === 'environment'">
                <view class="section-subtitle">环境信息</view>

                <view class="form-group">
                    <text class="label">停车场入口及价格</text>
                    <input class="input" v-model="environmentData.parkingEntrance" placeholder="请输入停车场入口及价格信息" />
                </view>

                <view class="form-group">
                    <text class="label">建议停车位</text>
                    <input class="input" v-model="environmentData.recommendedParking" placeholder="请输入建议停车位信息" />
                </view>

                <view class="form-group">
                    <text class="label">电梯入口</text>
                    <input class="input" v-model="environmentData.elevatorEntrance" placeholder="请输入电梯入口信息" />
                </view>

                <view class="form-group">
                    <text class="label">建议路线</text>
                    <input class="input" v-model="environmentData.recommendedRoute" placeholder="请输入建议路线信息" />
                </view>

                <view class="form-group">
                    <text class="label">楼顶施工环境</text>
                    <input class="input" v-model="environmentData.rooftopEnvironment" placeholder="请输入楼顶施工环境信息" />
                </view>

                <view class="form-group">
                    <text class="label">取水电情况</text>
                    <input class="input" v-model="environmentData.waterElectricity" placeholder="请输入取水电情况信息" />
                </view>

                <view class="form-group">
                    <text class="label">其他情况</text>
                    <input class="input" v-model="environmentData.otherConditions" placeholder="请输入其他情况信息" />
                </view>

                <view class="button-group">
                    <button class="btn-cancel" @click="goBackToPreparation">上一步</button>
                    <button class="btn-save" @click="proceedToInspection">下一步：开始踏勘</button>
                </view>
            </view>

            <!-- Inspection Step -->
            <view v-if="currentStep === 'inspection'">
                <view class="form-group">
                    <text class="cleaning-scope-title">清洗范围</text>
                </view>

                <!-- Display all added items first -->
                <view class="added-items-section" v-if="addedItems.length > 0">
                    <view v-for="(item, index) in addedItems" :key="index" class="added-item">
                        <!-- Item header with remove button -->
                        <view class="item-header">
                            <text class="item-title">{{item.type}} ({{index + 1}})</text>
                            <button class="remove-btn" @click="removeItem(index)">×</button>
                        </view>

                        <!-- Specs form for this item -->
                        <view class="item-specs">
                            <!-- 具体位置 (for 风机 and 其他) -->
                            <view class="spec-field" v-if="needsField(item.type, 'position')">
                                <text class="spec-label">具体位置 *</text>
                                <input class="spec-input" v-model="item.specs.position" placeholder="请输入具体位置" />
                            </view>

                            <!-- 型号规格 (required for all) -->
                            <view class="spec-field">
                                <text class="spec-label">型号规格 *</text>
                                <input class="spec-input" v-model="item.specs.model" placeholder="请输入型号规格" />
                            </view>

                            <!-- 单位 (locked for specific options) -->
                            <view class="spec-field">
                                <text class="spec-label">单位 *</text>
                                <input class="spec-input" v-model="item.specs.unit" placeholder="请输入单位"
                                    :readonly="isUnitLocked(item.type)" />
                            </view>

                            <!-- 数量 (required for all) -->
                            <view class="spec-field">
                                <text class="spec-label">数量 *</text>
                                <input class="spec-input" v-model="item.specs.quantity" placeholder="请输入数量"
                                    type="number" />
                            </view>

                            <!-- 作业频次 (required for all) -->
                            <view class="spec-field">
                                <text class="spec-label">作业频次 *</text>
                                <input class="spec-input" v-model="item.specs.frequency" placeholder="请输入作业频次" />
                            </view>

                            <!-- 长度 (only for 厨房烟罩) -->
                            <view class="spec-field" v-if="item.type === '厨房烟罩'">
                                <text class="spec-label">长度 *</text>
                                <input class="spec-input" v-model="item.specs.length" placeholder="请输入长度"
                                    type="number" />
                                <text class="unit-indicator">米(m)</text>
                            </view>

                            <!-- 拍照(清洗前) -->
                            <view class="spec-field">
                                <text class="spec-label">拍照(清洗前) *</text>
                                <view class="photo-section">
                                    <button class="photo-btn" @click="takePhoto(index, 'before')">📷 拍照</button>
                                    <text class="photo-count" v-if="item.specs.photoBefore.length > 0">已拍
                                        {{item.specs.photoBefore.length}} 张</text>
                                </view>
                            </view>
                        </view>
                    </view>
                </view>

                <!-- Clickable dropdown at the bottom -->
                <view class="add-item-section">
                    <view class="dropdown-container">
                        <view class="dropdown-header" @click="toggleDropdown">
                            <text>添加清洗项目</text>
                            <text class="dropdown-arrow" :class="{ rotated: isDropdownOpen }">▼</text>
                        </view>

                        <view class="dropdown-options" v-if="isDropdownOpen">
                            <view v-for="(scope, index) in availableScopes" :key="index" class="dropdown-option"
                                @click="selectScope(scope)">
                                <text>{{scope}}</text>
                            </view>
                        </view>
                    </view>
                </view>

                <view class="button-group">
                    <button class="btn-cancel" @click="goBackToEnvironment">上一步</button>
                    <button class="btn-save" @click="proceedToCompletion">下一步：完成踏勘</button>
                </view>
            </view>

            <!-- Completion Step -->
            <view v-if="currentStep === 'completion'">
                <view class="completion-section">
                    <view class="section-subtitle">踏勘完成</view>

                    <view class="summary-section">
                        <text class="summary-title">踏勘摘要</text>
                        <view class="summary-item">
                            <text class="summary-label">地点：</text>
                            <text class="summary-value">{{formData.didian}}</text>
                        </view>
                        <view class="summary-item">
                            <text class="summary-label">踏勘人员：</text>
                            <text class="summary-value">{{formData.tankanyuan}}</text>
                        </view>
                        <view class="summary-item">
                            <text class="summary-label">清洗范围：</text>
                            <text class="summary-value">{{getCleaningSummary()}}</text>
                        </view>
                    </view>

                    <view class="document-generation">
                        <text class="doc-title">文档生成</text>
                        <view class="doc-status" v-if="documentGenerating">
                            <text>正在生成踏勘报告...</text>
                        </view>
                        <view class="doc-actions" v-else>
                            <button class="doc-btn" @click="generateDocument">生成踏勘报告</button>
                            <button class="doc-btn" @click="previewDocument" v-if="documentGenerated">预览报告</button>
                        </view>
                    </view>
                </view>

                <view class="button-group">
                    <button class="btn-cancel" @click="goBackToInspection">返回修改</button>
                    <button class="btn-save" @click="save">保存并结束</button>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
    // NOTE: For production deployment, add this to app.json:
    // "requiredPrivateInfos": ["getLocation"]
    // and uncomment the real geolocation code in getLocation() method

    export default {
        data() {
            return {
                currentStep: 'preparation', // preparation, environment, inspection, completion
                documentGenerating: false,
                documentGenerated: false,
                isDropdownOpen: false,
                availableScopes: ['横管', '竖管', '风机', '净化器', '厨房烟罩', '其他'],
                addedItems: [], // Array to store all added cleaning items
                userInfo: {
                    name: '',
                    company: '',
                    isLoggedIn: false
                },
                formData: {
                    guishu: '',
                    didian: '',
                    tankanyuan: '',
                    mingcheng: ''
                },
                environmentData: {
                    parkingEntrance: '',
                    recommendedParking: '',
                    elevatorEntrance: '',
                    recommendedRoute: '',
                    rooftopEnvironment: '',
                    waterElectricity: '',
                    otherConditions: ''
                },
            };
        },
        computed: {
            progressWidth() {
                const steps = ['preparation', 'environment', 'inspection', 'completion'];
                const currentIndex = steps.indexOf(this.currentStep);
                return `${(currentIndex / (steps.length - 1)) * 100}%`;
            }
        },
        onLoad() {
            // Get user info from storage
            this.userInfo = uni.getStorageSync('userInfo') || {};
            if (!this.userInfo.isLoggedIn) {
                // If no user info, go back to main page
                uni.navigateBack();
                return;
            }
            // Auto-fill form fields
            this.formData.guishu = this.userInfo.company;
            this.formData.tankanyuan = this.userInfo.name;
        },
        methods: {
            // Step navigation and completion
            goToStep(targetStep) {
                this.currentStep = targetStep;
            },

            isStepCompleted(step) {
                const steps = ['preparation', 'environment', 'inspection', 'completion'];
                const currentIndex = steps.indexOf(this.currentStep);
                const stepIndex = steps.indexOf(step);
                return stepIndex < currentIndex;
            },

            // Step navigation methods
            proceedToEnvironment() {
                if (!this.formData.guishu || !this.formData.tankanyuan || !this.formData.didian || !this.formData
                    .mingcheng) {
                    uni.showToast({
                        title: '请完善基础信息',
                        icon: 'none'
                    });
                    return;
                }
                this.currentStep = 'environment';
            },

            goBackToPreparation() {
                this.currentStep = 'preparation';
            },

            proceedToInspection() {
                this.currentStep = 'inspection';
            },

            goBackToEnvironment() {
                this.currentStep = 'environment';
            },

            proceedToCompletion() {
                if (this.addedItems.length === 0) {
                    uni.showToast({
                        title: '请添加至少一个清洗项目',
                        icon: 'none'
                    });
                    return;
                }

                // Validate all added items
                for (let i = 0; i < this.addedItems.length; i++) {
                    const item = this.addedItems[i];
                    const specs = item.specs;

                    if (!specs.model || !specs.unit || !specs.quantity || !specs.frequency) {
                        uni.showToast({
                            title: `请完善${item.type}(${i + 1})的规格信息`,
                            icon: 'none'
                        });
                        return;
                    }

                    if (item.type === '厨房烟罩' && !specs.length) {
                        uni.showToast({
                            title: `请填写${item.type}(${i + 1})的长度`,
                            icon: 'none'
                        });
                        return;
                    }

                    if (specs.photoBefore.length === 0) {
                        uni.showToast({
                            title: `请为${item.type}(${i + 1})拍摄清洗前照片`,
                            icon: 'none'
                        });
                        return;
                    }
                }

                this.currentStep = 'completion';
            },

            goBackToInspection() {
                this.currentStep = 'inspection';
            },

            getCleaningSummary() {
                if (this.addedItems.length === 0) return '无';

                const summary = {};
                this.addedItems.forEach(item => {
                    if (summary[item.type]) {
                        summary[item.type]++;
                    } else {
                        summary[item.type] = 1;
                    }
                });

                return Object.entries(summary).map(([type, count]) =>
                    count > 1 ? `${type}(${count}个)` : type
                ).join(', ');
            },

            // Location method
            getLocation() {
                const demoLocations = [
                    '北京市朝阳区建国门外大街1号',
                    '上海市浦东新区陆家嘴环路1000号',
                    '广州市天河区珠江新城花城大道85号',
                    '深圳市南山区深南大道10000号',
                    '杭州市西湖区文三路90号'
                ];

                const randomLocation = demoLocations[Math.floor(Math.random() * demoLocations.length)];
                this.formData.didian = randomLocation;

                uni.showToast({
                    title: '模拟位置获取成功',
                    icon: 'success'
                });
            },

            removeItem(index) {
                this.addedItems.splice(index, 1);
                if (this.addedItems.length === 0) {
                    this.showAddDropdown = true; // Show dropdown if no items
                }
            },

            createDefaultSpecs(type) {
                let defaultUnit = '';
                if (['横管', '竖管'].includes(type)) defaultUnit = '米(m)';
                else if (['风机', '净化器'].includes(type)) defaultUnit = '台';
                else if (type === '厨房烟罩') defaultUnit = '个';

                return {
                    position: '',
                    model: '',
                    unit: defaultUnit,
                    quantity: '',
                    frequency: '',
                    length: '',
                    photoBefore: []
                };
            },

            isUnitLocked(option) {
                return ['横管', '竖管', '风机', '净化器', '厨房烟罩'].includes(option);
            },

            toggleDropdown() {
                this.isDropdownOpen = !this.isDropdownOpen;
            },

            selectScope(scope) {
                this.addNewItem(scope);
                this.isDropdownOpen = false; // Close dropdown after selection
            },

            addNewItem(type) {
                this.addedItems.push({
                    type: type,
                    specs: this.createDefaultSpecs(type)
                });
            },

            needsField(option, field) {
                const fieldRequirements = {
                    '横管': ['model', 'unit', 'quantity', 'frequency', 'photoBefore'],
                    '竖管': ['model', 'unit', 'quantity', 'frequency', 'photoBefore'],
                    '风机': ['position', 'model', 'unit', 'quantity', 'frequency', 'photoBefore'],
                    '净化器': ['model', 'unit', 'quantity', 'frequency', 'photoBefore'],
                    '厨房烟罩': ['model', 'unit', 'quantity', 'frequency', 'length', 'photoBefore'],
                    '其他': ['position', 'model', 'unit', 'quantity', 'frequency', 'photoBefore']
                };

                return fieldRequirements[option] && fieldRequirements[option].includes(field);
            },

            takePhoto(itemIndex, type) {
                uni.chooseImage({
                    count: 9,
                    sizeType: ['original', 'compressed'],
                    sourceType: ['album', 'camera'],
                    success: (res) => {
                        const specs = this.addedItems[itemIndex].specs;
                        if (type === 'before') {
                            specs.photoBefore.push(...res.tempFilePaths);
                        }
                        uni.showToast({
                            title: `已添加${res.tempFilePaths.length}张照片`,
                            icon: 'success'
                        });
                    },
                    fail: (err) => {
                        console.log('拍照失败', err);
                        uni.showToast({
                            title: '拍照失败',
                            icon: 'none'
                        });
                    }
                });
            },

            // Document generation methods
            generateDocument() {
                this.documentGenerating = true;

                setTimeout(() => {
                    this.documentGenerating = false;
                    this.documentGenerated = true;
                    uni.showToast({
                        title: '踏勘报告生成完成',
                        icon: 'success'
                    });
                }, 3000);
            },

            previewDocument() {
                uni.showToast({
                    title: '打开报告预览',
                    icon: 'success'
                });
            },

            // Save method
            save() {
                const completeData = {
                    ...this.formData,
                    environmentData: this.environmentData,
                    specDetails: this.specDetails,
                    timestamp: new Date().toISOString(),
                    inspector: this.userInfo.name,
                    company: this.userInfo.company
                };

                uni.setStorageSync('inspectionData', completeData);
                uni.showToast({
                    title: '踏勘数据保存成功',
                    icon: 'success'
                });
                this.generateDocument();

                setTimeout(() => {
                    this.goBack();
                }, 2000);
            },

            goBack() {
                uni.navigateBack();
            }
        }
    };
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

    .section-subtitle {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 20rpx;
    }

    .step-indicator {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30rpx;
        padding: 0 10rpx;
        position: relative;
    }

    .step {
        flex: 1;
        text-align: center;
        padding: 15rpx 10rpx;
        border-radius: 20rpx;
        font-size: 24rpx;
        background-color: #f0f0f0;
        color: #666;
        margin: 0 5rpx;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        z-index: 2;

        &:hover {
            background-color: #e0e0e0;
            transform: translateY(-2rpx);
        }

        &.active {
            background-color: #007AFF;
            color: white;
            box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
            transform: scale(1.05);
        }

        &.completed {
            background-color: #4CAF50;
            color: white;

            &::after {
                content: '✓';
                position: absolute;
                top: -10rpx;
                right: -10rpx;
                background-color: #2E7D32;
                color: white;
                border-radius: 50%;
                width: 30rpx;
                height: 30rpx;
                font-size: 16rpx;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        }
    }

    .progress-bar {
        position: absolute;
        bottom: 0;
        left: 10rpx;
        right: 10rpx;
        height: 6rpx;
        background-color: #f0f0f0;
        border-radius: 3rpx;
        overflow: hidden;
        z-index: 1;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #007AFF, #4CAF50);
        border-radius: 3rpx;
        transition: width 0.5s ease-in-out;
        position: relative;

        &::after {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 20rpx;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3));
            animation: shimmer 2s infinite;
        }
    }

    @keyframes shimmer {
        0% {
            transform: translateX(-100%);
        }

        100% {
            transform: translateX(100%);
        }
    }

    .login-status {
        background-color: #e8f5e8;
        padding: 20rpx;
        border-radius: 8rpx;
        margin-bottom: 30rpx;
        text-align: center;
    }

    .status-text {
        color: #2e7d32;
        font-size: 26rpx;
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

    .input {
        width: 100%;
        min-height: 80rpx;
        padding: 0 25rpx;
        border: 2rpx solid #e5e5e5;
        border-radius: 12rpx;
        font-size: 32rpx;
        line-height: 1.2;
        vertical-align: middle;
        background-color: #fafafa;
        box-sizing: border-box;

        &:focus {
            border-color: #007AFF;
            background-color: white;
        }
    }

    .location-wrapper {
        display: flex;
        gap: 10rpx;
    }

    .location-input {
        flex: 1;
    }

    .location-btn {
        padding: 20rpx;
        background-color: #007AFF;
        color: white;
        border: none;
        border-radius: 12rpx;
        font-size: 28rpx;
    }

    .cleaning-scope-section {
        border: 2rpx solid #e5e5e5;
        border-radius: 12rpx;
        padding: 20rpx;
    }

    .cleaning-scope-title {
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 15rpx;
    }

    .cleaning-options {
        display: flex;
        flex-direction: column;
        gap: 15rpx;
    }

    .option-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15rpx;
    }

    .option-label {
        display: flex;
        align-items: center;
        gap: 10rpx;
        cursor: pointer;

        text {
            font-size: 26rpx;
            color: #333;
        }
    }

    .quantity-selector {
        display: flex;
        align-items: center;
        gap: 10rpx;
    }

    .quantity-btn {
        width: 60rpx;
        height: 60rpx;
        border: 1rpx solid #ddd;
        border-radius: 6rpx;
        background-color: #f8f8f8;
        font-size: 28rpx;
        text-align: center;
        line-height: 60rpx;
    }

    .quantity-display {
        font-size: 26rpx;
        color: #333;
        min-width: 40rpx;
        text-align: center;
    }

    .specs-section {
        border-top: 1rpx solid #e5e5e5;
        margin-top: 20rpx;
    }

    .spec-item {
        border-bottom: 1rpx solid #f0f0f0;
        padding: 20rpx 0;

        &:last-child {
            border-bottom: none;
        }
    }

    .spec-title {
        font-size: 26rpx;
        font-weight: bold;
        color: #666;
        margin-bottom: 15rpx;
    }

    .spec-field {
        margin-bottom: 15rpx;
    }

    .spec-label {
        font-size: 24rpx;
        color: #333;
        margin-bottom: 8rpx;
        display: block;
    }

    .spec-input {
        width: calc(100% - 20rpx);
        padding: 10rpx;
        border: 1rpx solid #ddd;
        border-radius: 6rpx;
        font-size: 24rpx;
        background-color: white;
    }

    .unit-indicator {
        font-size: 22rpx;
        color: #666;
        margin-left: 10rpx;
    }

    .photo-section {
        display: flex;
        align-items: center;
        gap: 15rpx;
    }

    .photo-btn {
        padding: 10rpx 15rpx;
        background-color: #007AFF;
        color: white;
        border: none;
        border-radius: 6rpx;
        font-size: 22rpx;
    }

    .photo-count {
        font-size: 22rpx;
        color: #666;
    }

    .completion-section {
        margin-bottom: 30rpx;
    }

    .summary-section {
        background-color: #f8f8f8;
        padding: 20rpx;
        border-radius: 12rpx;
        margin-bottom: 30rpx;
    }

    .summary-title {
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 15rpx;
    }

    .summary-item {
        display: flex;
        margin-bottom: 10rpx;
    }

    .summary-label {
        font-size: 26rpx;
        color: #666;
        min-width: 120rpx;
    }

    .summary-value {
        font-size: 26rpx;
        color: #333;
        flex: 1;
    }

    .document-generation {
        background-color: #f0f8ff;
        padding: 20rpx;
        border-radius: 12rpx;
    }

    .doc-title {
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 15rpx;
    }

    .doc-status {
        text-align: center;
        padding: 20rpx;
        color: #666;
    }

    .doc-actions {
        display: flex;
        gap: 15rpx;
    }

    .doc-btn {
        flex: 1;
        padding: 15rpx;
        background-color: #007AFF;
        color: white;
        border: none;
        border-radius: 8rpx;
        font-size: 26rpx;
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

        &:disabled {
            background-color: #ccc;
            color: #999;
        }
    }

    .btn-cancel {
        background-color: #f0f0f0;
        color: #666;

        &:active {
            background-color: #e0e0e0;
        }
    }

    .dropdown-container {
        border: 2rpx solid #e5e5e5;
        border-radius: 12rpx;
        background-color: white;
    }

    .dropdown-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20rpx;
        cursor: pointer;

        &:active {
            background-color: #f8f8f8;
        }
    }

    .dropdown-arrow {
        transition: transform 0.3s ease;

        &.rotated {
            transform: rotate(180deg);
        }
    }

    .dropdown-options {
        border-top: 1rpx solid #e5e5e5;
    }

    .dropdown-option {
        padding: 15rpx 20rpx;
        border-bottom: 1rpx solid #f0f0f0;
        cursor: pointer;

        &:last-child {
            border-bottom: none;
        }

        &:active {
            background-color: #f0f8ff;
        }
    }
</style>