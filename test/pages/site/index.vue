<template>
    <view class="page-container">
        <!-- Sidebar -->
        <view class="sidebar" :class="{ 'sidebar-hidden': !sidebarVisible }">
            <view class="sidebar-content">
                <view class="step-nav"
                    :class="{ active: currentStep === 'preparation', completed: isStepCompleted('preparation') }"
                    @click="goToStep('preparation')">1. 准备</view>
                <view class="step-nav"
                    :class="{ active: currentStep === 'environment', completed: isStepCompleted('environment') }"
                    @click="goToStep('environment')">2. 环境信息</view>
                <view class="step-nav"
                    :class="{ active: currentStep === 'inspection', completed: isStepCompleted('inspection') }"
                    @click="goToStep('inspection')">3. 踏勘</view>
                <view class="step-nav"
                    :class="{ active: currentStep === 'completion', completed: isStepCompleted('completion') }"
                    @click="goToStep('completion')">4. 完成</view>
            </view>
        </view>

        <!-- Mini sidebar (when hidden) -->
        <view class="mini-sidebar" v-if="!sidebarVisible">
            <view class="mini-step" @click="goToStep('preparation')"
                :class="{ active: currentStep === 'preparation', completed: isStepCompleted('preparation') }">1</view>
            <view class="mini-step" @click="goToStep('environment')"
                :class="{ active: currentStep === 'environment', completed: isStepCompleted('environment') }">2</view>
            <view class="mini-step" @click="goToStep('inspection')"
                :class="{ active: currentStep === 'inspection', completed: isStepCompleted('inspection') }">3</view>
            <view class="mini-step" @click="goToStep('completion')"
                :class="{ active: currentStep === 'completion', completed: isStepCompleted('completion') }">4</view>
        </view>

        <!-- Sidebar toggle button -->
        <view class="sidebar-toggle" @click="sidebarVisible = !sidebarVisible">
            <text>{{ sidebarVisible ? '◀' : '▶' }}</text>
        </view>

        <!-- Main Content -->
        <view class="main-content" :class="{ 'content-expanded': !sidebarVisible }">
            <view class="container">
                <view class="form-section">
                    <view class="section-title">现场踏勘表单</view>

                    <!-- Login status indicator -->
                    <view class="login-status">
                        <text class="status-text">已登录: {{userInfo.name}} ({{userInfo.company}})</text>
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
                            <text class="label">现场位置</text>
                            <view class="location-display-box">
                                <text class="location-text">{{ formData.address || '点击下方按钮获取位置' }}</text>
                            </view>
                            <button class="location-btn" @click="getLocation">选择位置</button>
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
                            <input class="input" v-model="environmentData.parkingEntrance"
                                placeholder="请输入停车场入口及价格信息" />
                        </view>

                        <view class="form-group">
                            <text class="label">建议停车位</text>
                            <input class="input" v-model="environmentData.recommendedParking"
                                placeholder="请输入建议停车位信息" />
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
                            <input class="input" v-model="environmentData.rooftopEnvironment"
                                placeholder="请输入楼顶施工环境信息" />
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
                            <button class="btn-secondary" @click="goBackToPreparation">上一步</button>
                            <button class="btn-save" @click="proceedToInspection">下一步：开始踏勘</button>
                        </view>
                    </view>

                    <!-- Inspection Step -->
                    <view v-if="currentStep === 'inspection'">
                        <view class="section-subtitle">踏勘信息</view>

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
                                        <input class="spec-input" v-model="item.specs.frequency"
                                            placeholder="请输入作业频次" />
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
                                        <button class="photo-btn-add" @click="takePhoto(index, 'before')">📷
                                            添加照片</button>
                                        <view class="photo-preview-grid" v-if="item.specs.photoBefore.length > 0">
                                            <view class="photo-item"
                                                v-for="(photo, photoIndex) in item.specs.photoBefore" :key="photoIndex">
                                                <image class="photo-image" :src="photo" mode="aspectFill"></image>
                                                <view class="photo-delete"
                                                    @click="deletePhoto(index, 'before', photoIndex)">×</view>
                                            </view>
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
                            <button class="btn-secondary" @click="goBackToEnvironment">上一步</button>
                            <button class="btn-save" @click="proceedToCompletion">下一步：完成踏勘</button>
                        </view>
                    </view>

                    <!-- Completion Step -->
                    <view v-if="currentStep === 'completion'">
                        <view class="section-subtitle">踏勘完成</view>

                        <view class="completion-section">
                            <view class="summary-section">
                                <text class="summary-title">踏勘摘要</text>
                                <view class="summary-item">
                                    <text class="summary-label">名称：</text>
                                    <text class="summary-value">{{formData.mingcheng}}</text>
                                </view>
                                <view class="summary-item">
                                    <text class="summary-label">地点：</text>
                                    <text class="summary-value">{{formData.address}}</text>
                                </view>
                                <view class="summary-item">
                                    <text class="summary-label">踏勘人员：</text>
                                    <text class="summary-value">{{formData.tankanyuan}}</text>
                                </view>
                                <view class="summary-item">
                                    <text class="summary-label">归属：</text>
                                    <text class="summary-value">{{formData.guishu}}</text>
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
                                    <button class="doc-btn" @click="previewDocument"
                                        v-if="documentGenerated">预览报告</button>
                                </view>
                            </view>
                        </view>

                        <view class="button-group">
                            <button class="btn-secondary" @click="goBackToInspection">返回修改</button>
                            <button class="btn-save" @click="save">保存并结束</button>
                        </view>
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
    export default {
        data() {
            return {
                currentStep: 'preparation', // preparation, environment, inspection, completion
                documentGenerating: false,
                documentGenerated: false,
                isDropdownOpen: false,
                sidebarVisible: true,

                // Missing properties for step 3
                qingxifanwei: [],
                cleaningOptions: [{
                        value: 'hengguanshuguanxitong',
                        label: '横管竖管系统'
                    },
                    {
                        value: 'fengji',
                        label: '风机'
                    },
                    {
                        value: 'jinghuaqi',
                        label: '净化器'
                    },
                    {
                        value: 'chufangyanzao',
                        label: '厨房烟罩'
                    },
                    {
                        value: 'qita',
                        label: '其他'
                    }
                ],
                specDetails: {},
                pipeEntries: [{
                    diameter: '',
                    length: '',
                    note: ''
                }],

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
                    address: '',
                    latitude: '',
                    longitude: '',
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
            },
            selectedCleaningOptions() {
                return this.qingxifanwei;
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
                switch (step) {
                    case 'preparation':
                        return this.formData.guishu &&
                            this.formData.tankanyuan &&
                            this.formData.address &&
                            this.formData.mingcheng;

                    case 'environment':
                        // Check if at least some environment fields are filled
                        return this.environmentData.parkingEntrance ||
                            this.environmentData.recommendedParking ||
                            this.environmentData.elevatorEntrance ||
                            this.environmentData.recommendedRoute ||
                            this.environmentData.rooftopEnvironment ||
                            this.environmentData.waterElectricity ||
                            this.environmentData.otherConditions;

                    case 'inspection':
                        // Check if at least one item is added with complete specs
                        if (this.addedItems.length === 0) return false;

                        return this.addedItems.some(item => {
                            const specs = item.specs;
                            let isComplete = specs.model && specs.unit && specs.quantity && specs.frequency;

                            // Additional checks for specific types
                            if (item.type === '厨房烟罩') {
                                isComplete = isComplete && specs.length;
                            }
                            if (this.needsField(item.type, 'position')) {
                                isComplete = isComplete && specs.position;
                            }

                            return isComplete && specs.photoBefore.length > 0;
                        });

                    case 'completion':
                        // Completion step is only complete when all previous steps are done
                        return this.isStepCompleted('preparation') &&
                            this.isStepCompleted('environment') &&
                            this.isStepCompleted('inspection');

                    default:
                        return false;
                }
            },

            // Step navigation methods
            proceedToEnvironment() {
                if (!this.formData.guishu || !this.formData.tankanyuan || !this.formData.address || !this.formData
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
                        title: '请选择至少一个清洗范围',
                        icon: 'none'
                    });
                    return;
                }
                this.currentStep = 'completion';
            },

            goBackToInspection() {
                this.currentStep = 'inspection';
            },

            // New methods for step 3 functionality
            toggleCleaningOption(value) {
                const index = this.qingxifanwei.indexOf(value);
                if (index > -1) {
                    this.qingxifanwei.splice(index, 1);
                    delete this.specDetails[value];
                } else {
                    this.qingxifanwei.push(value);
                    // Use Vue.set or this.$set to make it reactive
                    this.$set(this.specDetails, value, {
                        quantity: '',
                        specification: '',
                        unit: ''
                    });
                }
                // Force reactivity update
                this.$forceUpdate();
            },

            getOptionLabel(option) {
                const found = this.cleaningOptions.find(opt => opt.value === option);
                return found ? found.label : option;
            },

            getSummaryText(option) {
                if (option === 'hengguanshuguanxitong') {
                    return `${this.pipeEntries.length}条管道`;
                }
                const specs = this.specDetails[option];
                if (!specs) return '';
                return `${specs.quantity || 0} ${specs.unit || ''}`;
            },

            addPipeEntry() {
                this.pipeEntries.push({
                    diameter: '',
                    length: '',
                    note: ''
                });
            },

            removePipeEntry(index) {
                if (this.pipeEntries.length > 1) {
                    this.pipeEntries.splice(index, 1);
                }
            },

            submitInspection() {
                this.save();
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
                uni.chooseLocation({
                    success: (res) => {
                        console.log('选择的位置:', res);
                        this.formData.latitude = res.latitude;
                        this.formData.longitude = res.longitude;
                        this.formData.address = res.address + ' ' + res.name;

                        uni.showToast({
                            title: '位置选择成功',
                            icon: 'success'
                        });
                    },
                    fail: (err) => {
                        console.error('位置选择失败:', err);
                    }
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
                console.log('Dropdown clicked, current state:', this.isDropdownOpen); // Add this debug line
                this.isDropdownOpen = !this.isDropdownOpen;
            },

            selectScope(scope) {
                console.log('Selected scope:', scope); // Add this debug line
                this.addNewItem(scope);
                this.isDropdownOpen = false;
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

            deletePhoto(itemIndex, type, photoIndex) {
                const specs = this.addedItems[itemIndex].specs;
                if (type === 'before') {
                    specs.photoBefore.splice(photoIndex, 1);
                }
                uni.showToast({
                    title: '照片已删除',
                    icon: 'success'
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
                    qingxifanwei: this.qingxifanwei,
                    specDetails: this.specDetails,
                    pipeEntries: this.pipeEntries,
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
    .page-container {
        position: relative;
        min-height: 100vh;
    }

    .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        width: 300rpx;
        height: 100vh;
        background: #f5f5f5;
        box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        transition: width 0.3s ease;

        &.sidebar-hidden {
            width: 80rpx;
        }
    }

    .sidebar-content {
        padding: 40rpx 20rpx;
        padding-top: 100rpx;
        opacity: 1;
        transition: opacity 0.3s ease;

        .sidebar-hidden & {
            opacity: 0;
            pointer-events: none;
        }
    }

    .step-nav {
        padding: 30rpx 20rpx;
        margin-bottom: 20rpx;
        border-radius: 12rpx;
        background-color: #e0e0e0;
        color: #666;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: center;
        font-size: 28rpx;

        &:hover {
            background-color: #d0d0d0;
            transform: translateX(10rpx);
        }

        &.active {
            background-color: #007AFF;
            color: white;

            // Remove the completed styling when active but not completed
            &:not(.completed) {
                &::after {
                    display: none;
                }
            }
        }

        &.completed {
            background-color: #4CAF50;
            color: white;
            position: relative;

            &::after {
                content: '✓';
                position: absolute;
                top: -8rpx;
                right: -8rpx;
                background-color: #2E7D32;
                color: white;
                border-radius: 50%;
                width: 30rpx;
                height: 30rpx;
                font-size: 18rpx;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        }
    }

    .mini-sidebar {
        position: fixed;
        left: 0;
        top: 0;
        width: 80rpx;
        height: 100vh;
        background: #f5f5f5;
        z-index: 1001;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;

        .sidebar-hidden~& {
            opacity: 1;
            pointer-events: all;
        }
    }

    .mini-step {
        width: 50rpx;
        height: 50rpx;
        border-radius: 50%;
        background-color: #e0e0e0;
        color: #666;
        margin-bottom: 20rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22rpx;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
            background-color: #d0d0d0;
            transform: scale(1.1);
        }

        &.active {
            background-color: #007AFF;
            color: white;
        }

        &.completed {
            background-color: #4CAF50;
            color: white;
        }
    }

    .sidebar-toggle {
        position: fixed;
        left: 20rpx;
        top: 20rpx;
        width: 50rpx;
        height: 50rpx;
        background-color: #666;
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 1002;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);

        &:hover {
            background-color: #555;
        }
    }

    .main-content {
        margin-left: 300rpx;
        transition: margin-left 0.3s ease;

        &.content-expanded {
            margin-left: 80rpx;
        }
    }

    .container {
        padding: 20rpx;
        background-color: #f5f5f5;
        min-height: 100vh;
        width: 100%;
        box-sizing: border-box;
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

        &.small {
            flex: 1;
            margin-right: 20rpx;

            &:last-child {
                margin-right: 0;
            }
        }
    }

    .form-row {
        display: flex;
        gap: 20rpx;
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

    .textarea {
        width: 100%;
        min-height: 120rpx;
        padding: 25rpx;
        border: 2rpx solid #e5e5e5;
        border-radius: 12rpx;
        font-size: 32rpx;
        line-height: 1.5;
        background-color: #fafafa;
        box-sizing: border-box;
        resize: vertical;

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

    .checkbox-group {
        display: flex;
        flex-direction: column;
        gap: 20rpx;
    }

    .checkbox-item {
        display: flex;
        align-items: center;
        gap: 15rpx;
        cursor: pointer;
    }

    .checkbox-text {
        font-size: 28rpx;
        color: #333;
    }

    .spec-section {
        background-color: #f8f8f8;
        padding: 25rpx;
        border-radius: 12rpx;
        margin-bottom: 25rpx;
    }

    .spec-title {
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 20rpx;
    }

    .multi-entry-section {
        margin-top: 20rpx;
    }

    .entry-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;
    }

    .entry-title {
        font-size: 26rpx;
        font-weight: bold;
        color: #333;
    }

    .btn-add {
        padding: 10rpx 20rpx;
        background-color: #28a745;
        color: white;
        border: none;
        border-radius: 8rpx;
        font-size: 24rpx;
        cursor: pointer;

        &:hover {
            background-color: #218838;
        }
    }

    .entry-item {
        border: 1rpx solid #e0e0e0;
        border-radius: 8rpx;
        padding: 20rpx;
        margin-bottom: 20rpx;
        background-color: white;
    }

    .entry-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15rpx;
    }

    .entry-number {
        font-size: 26rpx;
        font-weight: bold;
        color: #333;
    }

    .btn-remove {
        padding: 5rpx 15rpx;
        background-color: #dc3545;
        color: white;
        border: none;
        border-radius: 6rpx;
        font-size: 22rpx;
        cursor: pointer;

        &:hover {
            background-color: #c82333;
        }
    }

    .summary-section {
        background-color: #f0f8ff;
        padding: 25rpx;
        border-radius: 12rpx;
        margin-bottom: 30rpx;
    }

    .summary-item {
        display: flex;
        margin-bottom: 15rpx;
        align-items: center;
    }

    .summary-label {
        font-size: 26rpx;
        color: #666;
        min-width: 150rpx;
        font-weight: 500;
    }

    .summary-value {
        font-size: 26rpx;
        color: #333;
        flex: 1;
    }

    .summary-card {
        background-color: #f8f9fa;
        border-radius: 12rpx;
        padding: 25rpx;
        margin-bottom: 25rpx;
        border-left: 4rpx solid #007AFF;
    }

    .card-title {
        font-size: 30rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 20rpx;
        border-bottom: 1rpx solid #e0e0e0;
        padding-bottom: 10rpx;
    }

    .info-row {
        display: flex;
        margin-bottom: 15rpx;
        align-items: flex-start;
    }

    .info-label {
        font-size: 26rpx;
        color: #666;
        min-width: 150rpx;
        font-weight: 500;
    }

    .info-value {
        font-size: 26rpx;
        color: #333;
        flex: 1;
        word-break: break-word;
    }

    .button-group {
        display: flex;
        gap: 20rpx;
        margin-top: 40rpx;
    }

    .btn-save,
    .btn-secondary,
    .btn-submit {
        flex: 1;
        padding: 24rpx 0;
        border-radius: 12rpx;
        font-size: 32rpx;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;

        &:active {
            transform: translateY(1rpx);
        }

        &:disabled {
            background-color: #ccc;
            color: #999;
            cursor: not-allowed;
        }
    }

    .btn-save {
        background-color: #007AFF;
        color: white;

        &:hover {
            background-color: #0066CC;
        }
    }

    .btn-secondary {
        flex: 0.6; // Make it smaller than flex: 1
        padding: 20rpx 0; // Reduce padding
        background-color: #f0f0f0;
        color: #666;
        font-size: 28rpx; // Slightly smaller font

        &:hover {
            background-color: #e0e0e0;
        }
    }

    .btn-submit {
        background-color: #28a745;
        color: white;

        &:hover {
            background-color: #218838;
        }
    }

    // Add these styles to make the dropdown and items more visible
    .added-item {
        border: 1rpx solid #e0e0e0;
        border-radius: 8rpx;
        padding: 20rpx;
        margin-bottom: 15rpx;
        background-color: #fafafa;
    }

    .item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15rpx;
        padding-bottom: 10rpx;
        border-bottom: 1rpx solid #e0e0e0;
        position: relative;
    }

    .remove-btn {
        width: 50rpx;
        height: 50rpx;
        background-color: #999;
        color: white;
        border: none;
        border-radius: 8rpx;
        font-size: 32rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        position: absolute;
        right: 0rpx;
        top: 0rpx;

        &:active {
            background-color: #666;
        }
    }

    .item-title {
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
    }

    .item-specs {
        display: flex;
        flex-direction: column;
        gap: 15rpx;
    }

    .spec-field {
        display: flex;
        flex-direction: column;
    }

    .spec-label {
        font-size: 26rpx;
        color: #333;
        margin-bottom: 8rpx;
        font-weight: 500;
    }

    .spec-input {
        width: 100%;
        height: 70rpx;
        padding: 0 20rpx;
        border: 1rpx solid #ddd;
        border-radius: 6rpx;
        font-size: 28rpx;
        background-color: white;
        box-sizing: border-box;
    }

    .dropdown-container {
        border: 2rpx solid #007AFF; // Make it more prominent
        border-radius: 12rpx;
        background-color: white;
        margin-bottom: 20rpx;
    }

    .dropdown-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 25rpx 20rpx; // Increase padding
        cursor: pointer;
        font-size: 30rpx; // Larger font
        font-weight: bold;
        color: #007AFF;

        &:active {
            background-color: #f0f8ff;
        }
    }

    .dropdown-arrow {
        font-size: 24rpx;
        color: #007AFF;
        transition: transform 0.3s ease;

        &.rotated {
            transform: rotate(180deg);
        }
    }

    .dropdown-option {
        padding: 20rpx;
        border-bottom: 1rpx solid #f0f0f0;
        cursor: pointer;
        font-size: 28rpx;

        &:hover {
            background-color: #f0f8ff;
        }

        &:last-child {
            border-bottom: none;
        }

        &:active {
            background-color: #e6f3ff;
        }
    }

    .location-display-box {
        background-color: #fafafa;
        border: 2rpx solid #e5e5e5;
        border-radius: 12rpx;
        padding: 25rpx;
        min-height: 120rpx;
        margin-bottom: 20rpx;
    }

    .location-text {
        font-size: 32rpx;
        color: #333;
        line-height: 1.5;
        word-wrap: break-word;
    }

    .location-btn {
        width: 100%;
        background-color: #007AFF;
        color: white;
        border-radius: 12rpx;
        padding: 20rpx;
    }

    .photo-btn-add {
        width: 100%;
        padding: 20rpx;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 12rpx;
        font-size: 28rpx;
        margin-bottom: 20rpx;
    }

    .photo-preview-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15rpx;
    }

    .photo-item {
        position: relative;
        width: 100%;
        padding-bottom: 100%;
        border-radius: 8rpx;
        overflow: hidden;
    }

    .photo-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    .photo-delete {
        position: absolute;
        top: 5rpx;
        right: 5rpx;
        width: 40rpx;
        height: 40rpx;
        background-color: rgba(0, 0, 0, 0.6);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28rpx;
    }
</style>