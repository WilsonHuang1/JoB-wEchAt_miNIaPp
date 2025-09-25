<template>
    <view class="page-container">
        <!-- Sidebar -->
        <view class="sidebar" :class="{ 'sidebar-hidden': !sidebarVisible }">
            <view class="sidebar-content">
                <view class="step-nav"
                    :class="{ active: currentStep === 'beforeCleaning', completed: isStepCompleted('beforeCleaning') }"
                    @click="goToStep('beforeCleaning')">1. 清洗前状态</view>
                <view class="step-nav" data-step="afterCleaning" :class="{ 
                        active: currentStep === 'afterCleaning', 
                        completed: isStepCompleted('afterCleaning'),
                        locked: !isStepCompleted('beforeCleaning') && currentStep !== 'afterCleaning'
                    }" @click="goToStep('afterCleaning')">
                    2. 清洗后状态
                    <text class="lock-icon"
                        v-if="!isStepCompleted('beforeCleaning') && currentStep !== 'afterCleaning'">🔒</text>
                </view>
                <view class="step-nav"
                    :class="{ active: currentStep === 'workPhotos', completed: isStepCompleted('workPhotos') }"
                    @click="goToStep('workPhotos')">3. 工作照</view>
                <view class="step-nav"
                    :class="{ active: currentStep === 'environmentNotes', completed: isStepCompleted('environmentNotes') }"
                    @click="goToStep('environmentNotes')">4. 环境变更</view>
            </view>
        </view>

        <!-- Mini sidebar (when hidden) -->
        <view class="mini-sidebar" v-if="!sidebarVisible">
            <view class="mini-step" @click="goToStep('beforeCleaning')"
                :class="{ active: currentStep === 'beforeCleaning', completed: isStepCompleted('beforeCleaning') }">1
            </view>
            <view class="mini-step" @click="goToStep('afterCleaning')" :class="{ 
                      active: currentStep === 'afterCleaning', 
                      completed: isStepCompleted('afterCleaning'),
                      locked: !isStepCompleted('beforeCleaning') && currentStep !== 'afterCleaning'
                  }">
                2
                <text class="mini-lock"
                    v-if="!isStepCompleted('beforeCleaning') && currentStep !== 'afterCleaning'">🔒</text>
            </view>
            <view class="mini-step" @click="goToStep('workPhotos')"
                :class="{ active: currentStep === 'workPhotos', completed: isStepCompleted('workPhotos') }">3</view>
            <view class="mini-step" @click="goToStep('environmentNotes')"
                :class="{ active: currentStep === 'environmentNotes', completed: isStepCompleted('environmentNotes') }">
                4</view>
        </view>

        <!-- Sidebar toggle button -->
        <view class="sidebar-toggle" @click="sidebarVisible = !sidebarVisible">
            <text>{{ sidebarVisible ? '◀' : '▶' }}</text>
        </view>

        <!-- Main Content -->
        <view class="main-content" :class="{ 'content-expanded': !sidebarVisible }">
            <view class="container">
                <view class="form-section">
                    <view class="section-title">清洗工作记录</view>

                    <!-- Login status indicator -->
                    <view class="login-status">
                        <text class="status-text">已登录: {{userInfo.name}} ({{userInfo.company}})</text>
                    </view>

                    <!-- Step 1: 清洗前状态 -->
                    <view v-if="currentStep === 'beforeCleaning'">
                        <view class="section-subtitle">清洗前状态拍照</view>

                        <!-- Photo upload for selected options -->
                        <view class="selected-options" v-if="beforeCleaningSelected.length > 0">
                            <view class="selected-option" v-for="option in beforeCleaningSelected" :key="option">
                                <text class="option-label">{{ getOptionLabel(option) }}</text>

                                <!-- Sub-options selection for this area -->
                                <view class="sub-options-section">
                                    <text class="sub-options-title">选择{{ getOptionLabel(option) }}具体部位</text>
                                    <view class="sub-option-grid">
                                        <view class="sub-option-item" v-for="subOption in getSubOptionsForArea(option)"
                                            :key="subOption.value"
                                            :class="{ selected: isSubOptionSelected(option, subOption.value) }"
                                            @click="toggleSubOption(option, subOption.value)">
                                            <text class="sub-option-text">{{ subOption.label }}</text>
                                            <view class="sub-option-checkbox"
                                                v-if="isSubOptionSelected(option, subOption.value)">✓</view>
                                        </view>
                                    </view>
                                </view>

                                <!-- Custom sub-option input -->
                                <view class="form-group" style="margin-top: 20rpx;">
                                    <text class="label">其他具体部位</text>
                                    <input class="input" :value="customSubOptions[option] || ''"
                                        @input="updateCustomSubOption(option, $event)" placeholder="请输入其他具体部位" />
                                    <button class="add-custom-btn" @click="addCustomSubOption(option)"
                                        v-if="customSubOptions[option] && customSubOptions[option].trim()">添加</button>
                                </view>

                                <!-- Side notes -->
                                <view class="form-group" style="margin-top: 20rpx;">
                                    <text class="label">{{ getOptionLabel(option) }} 其他备注</text>
                                    <textarea class="textarea" :value="sideNotes[option] || ''"
                                        @input="updateSideNotes(option, $event)" placeholder="请输入其他备注信息"
                                        rows="3"></textarea>
                                </view>

                                <!-- Photo upload for selected sub-options -->
                                <view class="sub-photos-section" v-if="getSelectedSubOptions(option).length > 0">
                                    <view class="sub-photo-item" v-for="subOption in getSelectedSubOptions(option)"
                                        :key="subOption">
                                        <text class="sub-photo-label">{{ getSubOptionLabel(option, subOption) }}
                                            照片</text>
                                        <view class="photo-upload-area"
                                            @click="uploadDetailedPhotos('before', option, subOption)">
                                            <text>点击上传 {{ getSubOptionLabel(option, subOption) }} 清洗前照片</text>
                                            <text class="photo-count"
                                                v-if="getDetailedPhotoCount('before', option, subOption)">
                                                已上传 {{ getDetailedPhotoCount('before', option, subOption) }} 张
                                            </text>
                                        </view>
                                    </view>
                                </view>
                            </view>
                        </view>

                        <!-- Main cleaning options selection at bottom -->
                        <view class="cleaning-options">
                            <text class="options-title">选择清洗部位</text>
                            <view class="option-grid">
                                <view class="option-item" v-for="option in cleaningOptions" :key="option.value"
                                    :class="{ selected: beforeCleaningSelected.includes(option.value) }"
                                    @click="toggleBeforeCleaningOption(option.value)">
                                    <text class="option-text">{{ option.label }}</text>
                                    <view class="option-checkbox" v-if="beforeCleaningSelected.includes(option.value)">✓
                                    </view>
                                </view>
                            </view>
                        </view>

                        <!-- Custom main option input -->
                        <view class="form-group" style="margin-top: 30rpx;">
                            <text class="label">其他部位</text>
                            <input class="input" v-model="customBeforeOption" placeholder="请输入其他需要清洗的部位" />
                            <button class="add-custom-btn" @click="addCustomBeforeOption"
                                v-if="customBeforeOption.trim()">添加</button>
                        </view>

                        <view class="button-group">
                            <button class="btn-save" @click="goToStep('afterCleaning')"
                                :disabled="!isStepCompleted('beforeCleaning')"
                                :class="{ 'btn-disabled': !isStepCompleted('beforeCleaning') }">
                                下一步
                            </button>
                        </view>
                    </view>

                    <!-- Step 2: 清洗后状态 -->
                    <view v-if="currentStep === 'afterCleaning'">
                        <view class="section-subtitle">清洗后状态拍照</view>

                        <!-- Show same options as selected in before cleaning -->
                        <view class="cleaning-options">
                            <text class="options-title">清洗后状态拍照 (基于清洗前选择)</text>
                        </view>

                        <!-- Photo upload for the same options selected in before cleaning -->
                        <view class="selected-options" v-if="beforeCleaningSelected.length > 0">
                            <view class="selected-option" v-for="option in beforeCleaningSelected" :key="option">
                                <text class="option-label">{{ getOptionLabel(option) }} 清洗后照片</text>

                                <!-- Side notes display (read-only) -->
                                <view class="form-group" v-if="sideNotes[option] && sideNotes[option].trim()"
                                    style="margin-bottom: 20rpx;">
                                    <text class="label">备注信息</text>
                                    <view class="notes-display">{{ sideNotes[option] }}</view>
                                </view>

                                <!-- Photo upload for selected sub-options (based on before cleaning) -->
                                <view class="sub-photos-section" v-if="getSelectedSubOptions(option).length > 0">
                                    <view class="sub-photo-item" v-for="subOption in getSelectedSubOptions(option)"
                                        :key="subOption">
                                        <text class="sub-photo-label">{{ getSubOptionLabel(option, subOption) }}
                                            清洗后照片</text>
                                        <view class="photo-upload-area"
                                            @click="uploadDetailedPhotos('after', option, subOption)">
                                            <text>点击上传 {{ getSubOptionLabel(option, subOption) }} 清洗后照片</text>
                                            <text class="photo-count"
                                                v-if="getDetailedPhotoCount('after', option, subOption)">
                                                已上传 {{ getDetailedPhotoCount('after', option, subOption) }} 张
                                            </text>
                                        </view>
                                    </view>
                                </view>
                            </view>
                        </view>

                        <view class="button-group">
                            <button class="btn-secondary" @click="goToStep('beforeCleaning')">上一步</button>
                            <button class="btn-save" @click="goToStep('workPhotos')"
                                :disabled="!isAfterCleaningComplete()">下一步</button>
                        </view>
                    </view>

                    <!-- Step 3: 工作照 -->
                    <view v-if="currentStep === 'workPhotos'">
                        <view class="section-subtitle">工作照拍摄</view>

                        <view class="photo-upload-section">
                            <text class="label">上传工作照片</text>
                            <view class="photo-upload-area" @click="uploadWorkPhotos">
                                <text>点击上传工作照片</text>
                                <text class="photo-count" v-if="workPhotos.length">
                                    已上传 {{ workPhotos.length }} 张
                                </text>
                            </view>
                        </view>

                        <view class="button-group">
                            <button class="btn-secondary" @click="goToStep('afterCleaning')">上一步</button>
                            <button class="btn-save" @click="goToStep('environmentNotes')">下一步</button>
                        </view>
                    </view>

                    <!-- Step 4: 环境变更记录 -->
                    <view v-if="currentStep === 'environmentNotes'">
                        <view class="section-subtitle">环境变更记录</view>

                        <view class="form-group">
                            <text class="label">环境变更记录</text>
                            <textarea class="textarea" v-model="environmentNotes" placeholder="请记录环境变更情况、特殊注意事项等"
                                rows="8"></textarea>
                        </view>

                        <view class="button-group">
                            <button class="btn-secondary" @click="goToStep('workPhotos')">上一步</button>
                            <button class="btn-save" @click="saveCleaningRecord">保存记录</button>
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
                currentStep: 'beforeCleaning',
                sidebarVisible: true,

                // Cleaning options
                cleaningOptions: [{
                        value: 'kitchen',
                        label: '厨房'
                    },
                    {
                        value: 'pipe',
                        label: '管道'
                    },
                    {
                        value: 'fan',
                        label: '风机'
                    },
                    {
                        value: 'purifier',
                        label: '净化器'
                    }
                ],

                // Sub-options for each cleaning area (removed 其他)
                cleaningSubOptions: {
                    kitchen: [{
                            value: 'environment',
                            label: '环境'
                        },
                        {
                            value: 'stove',
                            label: '灶台'
                        },
                        {
                            value: 'hood',
                            label: '烟罩'
                        },
                        {
                            value: 'grease_filter',
                            label: '油篦子'
                        },
                        {
                            value: 'hood_pipe',
                            label: '烟罩横管'
                        }
                    ],
                    pipe: [{
                            value: 'pipe_environment',
                            label: '管道环境'
                        },
                        {
                            value: 'pipe_leak',
                            label: '管道漏油'
                        },
                        {
                            value: 'damage_points',
                            label: '破损点'
                        }
                    ],
                    fan: [{
                            value: 'location_environment',
                            label: '环境位置'
                        },
                        {
                            value: 'appearance',
                            label: '外观'
                        },
                        {
                            value: 'fan_impeller',
                            label: '风机叶轮'
                        },
                        {
                            value: 'exhaust_outlet',
                            label: '排风口'
                        }
                    ],
                    purifier: [{
                            value: 'location_environment',
                            label: '位置环境'
                        },
                        {
                            value: 'appearance',
                            label: '外观'
                        },
                        {
                            value: 'electric_field',
                            label: '电场'
                        }
                    ]
                },

                // Selected options for before and after
                beforeCleaningSelected: [],
                customBeforeOption: '',

                // Selected sub-options for each area
                selectedSubOptions: {}, // { kitchen: ['environment', 'stove'], pipe: ['pipe_leak'] }

                // Custom sub-options input
                customSubOptions: {}, // { kitchen: 'custom text', pipe: 'custom text' }

                // Side notes for each area
                sideNotes: {}, // { kitchen: 'some notes', pipe: 'other notes' }

                // Photos organized by type and option
                beforePhotos: {}, // Keep for backward compatibility
                afterPhotos: {}, // Keep for backward compatibility

                // Detailed photos organized by area and sub-option
                detailedBeforePhotos: {}, // { kitchen: { environment: [photos], stove: [photos] } }
                detailedAfterPhotos: {},

                workPhotos: [],
                environmentNotes: '',

                userInfo: {
                    name: uni.getStorageSync('userName') || '未知用户',
                    company: uni.getStorageSync('userCompany') || '未知公司'
                }
            };
        },

        onLoad() {
            // Load any saved data
            this.loadSavedData();
        },

        methods: {
            // Step navigation with locking
            goToStep(step) {
                // Check if trying to access step 2 (afterCleaning)
                if (step === 'afterCleaning') {
                    // Only allow if step 1 is completed
                    if (!this.isStepCompleted('beforeCleaning')) {
                        uni.showToast({
                            title: '请先完成清洗前状态拍照',
                            icon: 'none',
                            duration: 2000
                        });
                        return; // Block access
                    }
                }

                // Allow access to all other steps (beforeCleaning, workPhotos, environmentNotes)
                this.currentStep = step;
            },

            // Toggle before cleaning option selection
            toggleBeforeCleaningOption(value) {
                const index = this.beforeCleaningSelected.indexOf(value);
                if (index > -1) {
                    this.beforeCleaningSelected.splice(index, 1);
                    // Remove photos and sub-options for this option
                    delete this.beforePhotos[value];
                    delete this.afterPhotos[value];
                    delete this.selectedSubOptions[value];
                    delete this.detailedBeforePhotos[value];
                    delete this.detailedAfterPhotos[value];
                    delete this.sideNotes[value];
                } else {
                    this.beforeCleaningSelected.push(value);
                    // Initialize photo arrays and sub-options
                    this.$set(this.beforePhotos, value, []);
                    this.$set(this.afterPhotos, value, []);
                    this.$set(this.selectedSubOptions, value, []);
                    this.$set(this.detailedBeforePhotos, value, {});
                    this.$set(this.detailedAfterPhotos, value, {});
                    this.$set(this.sideNotes, value, '');
                }
            },

            // Add custom option
            addCustomBeforeOption() {
                if (this.customBeforeOption.trim()) {
                    const customValue = 'custom_' + Date.now();
                    this.cleaningOptions.push({
                        value: customValue,
                        label: this.customBeforeOption.trim()
                    });
                    this.beforeCleaningSelected.push(customValue);
                    this.$set(this.beforePhotos, customValue, []);
                    this.$set(this.afterPhotos, customValue, []);
                    this.$set(this.selectedSubOptions, customValue, []);
                    this.$set(this.detailedBeforePhotos, customValue, {});
                    this.$set(this.detailedAfterPhotos, customValue, {});
                    this.$set(this.sideNotes, customValue, '');
                    this.customBeforeOption = '';
                }
            },

            // Get option label by value
            getOptionLabel(value) {
                const option = this.cleaningOptions.find(opt => opt.value === value);
                return option ? option.label : value;
            },

            // Get sub-options for a specific area
            getSubOptionsForArea(area) {
                return this.cleaningSubOptions[area] || [];
            },

            // Check if sub-option is selected
            isSubOptionSelected(area, subOption) {
                return this.selectedSubOptions[area] && this.selectedSubOptions[area].includes(subOption);
            },

            // Toggle sub-option selection
            toggleSubOption(area, subOption) {
                if (!this.selectedSubOptions[area]) {
                    this.$set(this.selectedSubOptions, area, []);
                }

                const index = this.selectedSubOptions[area].indexOf(subOption);
                if (index > -1) {
                    this.selectedSubOptions[area].splice(index, 1);
                    // Remove photos for this sub-option
                    if (this.detailedBeforePhotos[area]) {
                        delete this.detailedBeforePhotos[area][subOption];
                    }
                    if (this.detailedAfterPhotos[area]) {
                        delete this.detailedAfterPhotos[area][subOption];
                    }
                } else {
                    this.selectedSubOptions[area].push(subOption);
                    // Initialize photo storage
                    if (!this.detailedBeforePhotos[area]) {
                        this.$set(this.detailedBeforePhotos, area, {});
                    }
                    if (!this.detailedAfterPhotos[area]) {
                        this.$set(this.detailedAfterPhotos, area, {});
                    }
                    this.$set(this.detailedBeforePhotos[area], subOption, []);
                    this.$set(this.detailedAfterPhotos[area], subOption, []);
                }
            },

            // Update custom sub-option input
            updateCustomSubOption(area, event) {
                this.$set(this.customSubOptions, area, event.detail.value);
            },

            // Update side notes
            updateSideNotes(area, event) {
                this.$set(this.sideNotes, area, event.detail.value);
            },

            // Add custom sub-option
            addCustomSubOption(area) {
                const customText = this.customSubOptions[area];
                if (customText && customText.trim()) {
                    const customValue = 'custom_' + Date.now();

                    // Add to sub-options list
                    if (!this.cleaningSubOptions[area]) {
                        this.$set(this.cleaningSubOptions, area, []);
                    }
                    this.cleaningSubOptions[area].push({
                        value: customValue,
                        label: customText.trim()
                    });

                    // Select it automatically
                    if (!this.selectedSubOptions[area]) {
                        this.$set(this.selectedSubOptions, area, []);
                    }
                    this.selectedSubOptions[area].push(customValue);

                    // Initialize photo storage
                    if (!this.detailedBeforePhotos[area]) {
                        this.$set(this.detailedBeforePhotos, area, {});
                    }
                    if (!this.detailedAfterPhotos[area]) {
                        this.$set(this.detailedAfterPhotos, area, {});
                    }
                    this.$set(this.detailedBeforePhotos[area], customValue, []);
                    this.$set(this.detailedAfterPhotos[area], customValue, []);

                    // Clear input
                    this.$set(this.customSubOptions, area, '');
                }
            },

            // Get selected sub-options for an area
            getSelectedSubOptions(area) {
                return this.selectedSubOptions[area] || [];
            },

            // Get sub-option label
            getSubOptionLabel(area, subOptionValue) {
                const subOptions = this.getSubOptionsForArea(area);
                const found = subOptions.find(opt => opt.value === subOptionValue);
                return found ? found.label : subOptionValue;
            },

            // Upload detailed photos
            uploadDetailedPhotos(type, area, subOption) {
                console.log(`Upload ${type} photos for ${area} - ${subOption}`);
                uni.chooseImage({
                    count: 9,
                    success: (res) => {
                        const photosObj = type === 'before' ? this.detailedBeforePhotos : this
                            .detailedAfterPhotos;

                        if (!photosObj[area]) {
                            this.$set(photosObj, area, {});
                        }
                        if (!photosObj[area][subOption]) {
                            this.$set(photosObj[area], subOption, []);
                        }

                        photosObj[area][subOption].push(...res.tempFilePaths);

                        uni.showToast({
                            title: `已选择 ${res.tempFilePaths.length} 张照片`,
                            icon: 'success'
                        });
                    },
                    fail: (err) => {
                        console.error('选择图片失败:', err);
                        uni.showToast({
                            title: '选择图片失败',
                            icon: 'error'
                        });
                    }
                });
            },

            // Get detailed photo count
            getDetailedPhotoCount(type, area, subOption) {
                const photosObj = type === 'before' ? this.detailedBeforePhotos : this.detailedAfterPhotos;
                return photosObj[area] && photosObj[area][subOption] ? photosObj[area][subOption].length : 0;
            },

            // Upload work photos
            uploadWorkPhotos() {
                console.log('Upload work photos');
                uni.chooseImage({
                    count: 9,
                    success: (res) => {
                        this.workPhotos.push(...res.tempFilePaths);

                        uni.showToast({
                            title: `已选择 ${res.tempFilePaths.length} 张照片`,
                            icon: 'success'
                        });
                    },
                    fail: (err) => {
                        console.error('选择图片失败:', err);
                        uni.showToast({
                            title: '选择图片失败',
                            icon: 'error'
                        });
                    }
                });
            },

            // Check if after cleaning is complete
            isAfterCleaningComplete() {
                return this.beforeCleaningSelected.every(area => {
                    const selectedSubs = this.getSelectedSubOptions(area);
                    return selectedSubs.every(subOption => {
                        return this.getDetailedPhotoCount('after', area, subOption) > 0;
                    });
                });
            },

            // Check if step is completed
            isStepCompleted(step) {
                switch (step) {
                    case 'beforeCleaning':
                        return this.beforeCleaningSelected.length > 0 &&
                            this.beforeCleaningSelected.every(area => {
                                const selectedSubs = this.getSelectedSubOptions(area);
                                return selectedSubs.length > 0 && selectedSubs.every(subOption => {
                                    return this.getDetailedPhotoCount('before', area, subOption) > 0;
                                });
                            });
                    case 'afterCleaning':
                        return this.isAfterCleaningComplete();
                    case 'workPhotos':
                        return this.workPhotos.length > 0;
                    case 'environmentNotes':
                        return this.environmentNotes.trim().length > 0;
                    default:
                        return false;
                }
            },

            // Save cleaning record
            saveCleaningRecord() {
                const cleaningData = {
                    beforeCleaningSelected: this.beforeCleaningSelected,
                    selectedSubOptions: this.selectedSubOptions,
                    sideNotes: this.sideNotes,
                    detailedBeforePhotos: this.detailedBeforePhotos,
                    detailedAfterPhotos: this.detailedAfterPhotos,
                    workPhotos: this.workPhotos,
                    environmentNotes: this.environmentNotes,
                    customOptions: this.cleaningOptions.filter(opt => opt.value.startsWith('custom_')),
                    customSubOptions: Object.keys(this.cleaningSubOptions).reduce((acc, area) => {
                        const customSubs = this.cleaningSubOptions[area].filter(sub => sub.value.startsWith(
                            'custom_'));
                        if (customSubs.length > 0) {
                            acc[area] = customSubs;
                        }
                        return acc;
                    }, {}),
                    timestamp: new Date().toISOString(),
                    worker: this.userInfo.name,
                    company: this.userInfo.company
                };

                uni.setStorageSync('cleaningData', cleaningData);
                uni.showToast({
                    title: '清洗记录保存成功',
                    icon: 'success'
                });

                setTimeout(() => {
                    uni.navigateBack();
                }, 2000);
            },

            // Load saved data
            loadSavedData() {
                try {
                    const savedData = uni.getStorageSync('cleaningData');
                    if (savedData) {
                        this.beforeCleaningSelected = savedData.beforeCleaningSelected || [];
                        this.selectedSubOptions = savedData.selectedSubOptions || {};
                        this.sideNotes = savedData.sideNotes || {};
                        this.detailedBeforePhotos = savedData.detailedBeforePhotos || {};
                        this.detailedAfterPhotos = savedData.detailedAfterPhotos || {};
                        this.workPhotos = savedData.workPhotos || [];
                        this.environmentNotes = savedData.environmentNotes || '';

                        // Restore custom options
                        if (savedData.customOptions) {
                            this.cleaningOptions.push(...savedData.customOptions);
                        }

                        // Restore custom sub-options
                        if (savedData.customSubOptions) {
                            Object.keys(savedData.customSubOptions).forEach(area => {
                                if (this.cleaningSubOptions[area]) {
                                    this.cleaningSubOptions[area].push(...savedData.customSubOptions[area]);
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.error('加载保存数据失败:', error);
                }
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
        position: relative;

        &:hover {
            background-color: #d0d0d0;
            transform: translateX(10rpx);
        }

        &.active {
            background-color: #007AFF;
            color: white;

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

            // Remove checkmark for step 2 (afterCleaning)
            &:not([data-step="afterCleaning"])::after {
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

        &.locked {
            background-color: #f5f5f5;
            color: #ccc;
            cursor: not-allowed;

            &:hover {
                background-color: #f5f5f5;
                transform: none;
            }
        }
    }

    .lock-icon {
        font-size: 20rpx;
        margin-left: 10rpx;
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
        position: relative;

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

        &.locked {
            background-color: #f5f5f5;
            color: #ccc;
            cursor: not-allowed;

            &:hover {
                background-color: #f5f5f5;
                transform: none;
            }
        }
    }

    .mini-lock {
        position: absolute;
        top: -5rpx;
        right: -5rpx;
        font-size: 16rpx;
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
        min-height: 100vh;
        padding: 20rpx;

        &.content-expanded {
            margin-left: 80rpx;
        }
    }

    .container {
        max-width: 800rpx;
        margin: 0 auto;
    }

    .form-section {
        background: white;
        border-radius: 16rpx;
        padding: 40rpx;
        margin-bottom: 20rpx;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
    }

    .section-title {
        font-size: 44rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 30rpx;
        text-align: center;
    }

    .section-subtitle {
        font-size: 36rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 30rpx;
        text-align: center;
        border-bottom: 2rpx solid #e5e5e5;
        padding-bottom: 20rpx;
    }

    .login-status {
        background-color: #f0f8ff;
        padding: 20rpx;
        border-radius: 12rpx;
        margin-bottom: 30rpx;
        text-align: center;
    }

    .status-text {
        color: #007AFF;
        font-size: 28rpx;
    }

    .cleaning-options {
        margin-bottom: 30rpx;
        padding: 30rpx;
        background-color: #fff8e1;
        border-radius: 16rpx;
        border: 2rpx solid #ffc107;
    }

    .options-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 20rpx;
        text-align: center;
    }

    .option-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20rpx;
    }

    .option-item {
        position: relative;
        padding: 30rpx;
        border: 2rpx solid #e5e5e5;
        border-radius: 12rpx;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;

        &.selected {
            border-color: #007AFF;
            background-color: #f0f8ff;
        }

        &:active {
            transform: scale(0.98);
        }
    }

    .option-text {
        font-size: 28rpx;
        color: #333;
    }

    .option-checkbox {
        position: absolute;
        top: -8rpx;
        right: -8rpx;
        background-color: #007AFF;
        color: white;
        border-radius: 50%;
        width: 30rpx;
        height: 30rpx;
        font-size: 18rpx;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .sub-options-section {
        margin: 20rpx 0;
        padding: 20rpx;
        background-color: #f9f9f9;
        border-radius: 12rpx;
    }

    .sub-options-title {
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 15rpx;
    }

    .sub-option-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15rpx;
    }

    .sub-option-item {
        position: relative;
        padding: 20rpx;
        border: 2rpx solid #e5e5e5;
        border-radius: 8rpx;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        background-color: white;

        &.selected {
            border-color: #007AFF;
            background-color: #f0f8ff;
        }
    }

    .sub-option-text {
        font-size: 24rpx;
        color: #333;
    }

    .sub-option-checkbox {
        position: absolute;
        top: -6rpx;
        right: -6rpx;
        background-color: #007AFF;
        color: white;
        border-radius: 50%;
        width: 24rpx;
        height: 24rpx;
        font-size: 16rpx;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .sub-photos-section {
        margin-top: 20rpx;
    }

    .sub-photo-item {
        margin-bottom: 20rpx;
    }

    .sub-photo-label {
        display: block;
        font-size: 26rpx;
        font-weight: bold;
        color: #555;
        margin-bottom: 8rpx;
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
        min-height: 120rpx;
        resize: none;
    }

    .notes-display {
        padding: 20rpx;
        background-color: #f9f9f9;
        border-radius: 8rpx;
        border: 1rpx solid #e5e5e5;
        color: #666;
        font-size: 26rpx;
        line-height: 1.4;
    }

    .add-custom-btn {
        margin-top: 20rpx;
        padding: 20rpx;
        background-color: #007AFF;
        color: white;
        border-radius: 8rpx;
        border: none;
        font-size: 24rpx;
        cursor: pointer;

        &:active {
            background-color: #0066CC;
        }
    }

    .selected-options {
        margin-top: 30rpx;
    }

    .selected-option {
        margin-bottom: 30rpx;
        padding: 20rpx;
        border: 1rpx solid #e5e5e5;
        border-radius: 12rpx;
        background-color: #fafafa;
    }

    .option-label {
        display: block;
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 20rpx;
        text-align: center;
        background-color: #007AFF;
        color: white;
        padding: 15rpx;
        border-radius: 8rpx;
    }

    .photo-upload-area {
        border: 2rpx dashed #ccc;
        border-radius: 12rpx;
        padding: 40rpx;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
            border-color: #007AFF;
        }

        &:active {
            transform: scale(0.98);
        }
    }

    .photo-upload-section {
        margin-bottom: 30rpx;
    }

    .photo-count {
        display: block;
        font-size: 24rpx;
        color: #666;
        margin-top: 10rpx;
    }

    .button-group {
        display: flex;
        gap: 20rpx;
        margin-top: 40rpx;
    }

    .btn-save,
    .btn-secondary {
        flex: 1;
        padding: 24rpx 0;
        border-radius: 12rpx;
        font-size: 32rpx;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .btn-save {
        background-color: #007AFF;
        color: white;

        &:active {
            background-color: #0066CC;
        }

        &.btn-disabled {
            background-color: #ccc !important;
            cursor: not-allowed;

            &:active {
                background-color: #ccc !important;
            }
        }
    }

    .btn-secondary {
        background-color: #f0f0f0;
        color: #666;

        &:active {
            background-color: #e0e0e0;
        }
    }
</style>