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
                        <view class="selected-options" v-if="selectedCleaningItems.length > 0">
                            <view class="selected-option" v-for="item in selectedCleaningItems" :key="item.id">
                                <view class="option-header">
                                    <text class="option-label">{{ item.label }}</text>
                                    <button class="remove-btn" @click="removeCleaningItem(item.id)">移除</button>
                                </view>

                                <!-- Sub-options selection for this area -->
                                <view class="sub-options-section">
                                    <text class="sub-options-title">选择{{ item.label }}具体部位</text>
                                    <view class="sub-option-grid">
                                        <view class="sub-option-item"
                                            v-for="subOption in getSubOptionsForArea(item.value)" :key="subOption.value"
                                            :class="{ selected: isSubOptionSelected(item.id, subOption.value) }"
                                            @click="toggleSubOption(item.id, subOption.value)">
                                            <text class="sub-option-text">{{ subOption.label }}</text>
                                            <view class="sub-option-checkbox"
                                                v-if="isSubOptionSelected(item.id, subOption.value)">✓</view>
                                        </view>
                                    </view>
                                </view>

                                <!-- Photo upload for custom options (其他部位) -->
                                <view class="custom-photo-section" v-if="item.value.startsWith('custom_')">
                                    <text class="sub-photo-label">{{ item.label }} 清洗前照片</text>
                                    <button class="photo-btn-add"
                                        @click="uploadCustomOptionPhotos('before', item.value)">
                                        📷 添加照片
                                    </button>
                                    <view class="photo-preview-grid"
                                        v-if="getCustomPhotoCount('before', item.value) > 0">
                                        <view class="photo-item" v-for="(photo, photoIndex) in workPhotos"
                                            :key="photoIndex">
                                            <image class="photo-image" :src="photo" mode="aspectFill"
                                                @click="reEditPhoto(photo, 'work', null, null, null, photoIndex)">
                                            </image>
                                            <view class="photo-delete" @click.stop="deleteWorkPhoto(photoIndex)">×
                                            </view>
                                        </view>
                                    </view>
                                </view>

                                <!-- Photo upload for selected sub-options -->
                                <view class="sub-photos-section" v-if="getSelectedSubOptions(item.id).length > 0">
                                    <view class="sub-photo-item" v-for="subOption in getSelectedSubOptions(item.id)"
                                        :key="subOption">
                                        <text class="sub-photo-label">{{ getSubOptionLabel(item.value, subOption) }}
                                            照片</text>
                                        <button class="photo-btn-add"
                                            @click="uploadDetailedPhotos('before', item.id, subOption)">
                                            📷 添加照片
                                        </button>
                                        <view class="photo-preview-grid"
                                            v-if="getDetailedPhotoCount('before', item.id, subOption) > 0">
                                            <view class="photo-item" v-for="(photo, photoIndex) in workPhotos"
                                                :key="photoIndex">
                                                <image class="photo-image" :src="photo" mode="aspectFill"
                                                    @click="reEditPhoto(photo, 'work', null, null, null, photoIndex)">
                                                </image>
                                                <view class="photo-delete" @click.stop="deleteWorkPhoto(photoIndex)">×
                                                </view>
                                            </view>
                                        </view>
                                    </view>
                                </view>

                                <!-- Side notes -->
                                <view class="form-group" style="margin-top: 20rpx;">
                                    <text class="label">{{ item.label }} 其他备注</text>
                                    <textarea class="textarea small-textarea" :value="sideNotes[item.id] || ''"
                                        @input="updateSideNotes(item.id, $event)" placeholder="请输入其他备注信息"
                                        rows="3"></textarea>
                                </view>
                            </view>
                        </view>

                        <!-- Main cleaning options selection at bottom -->
                        <view class="cleaning-options">
                            <text class="options-title">选择清洗部位</text>
                            <view class="option-grid">
                                <view class="option-item" v-for="option in cleaningOptions" :key="option.value"
                                    @click="addCleaningOption(option.value)">
                                    <text class="option-text">{{ option.label }}</text>
                                </view>
                            </view>
                        </view>

                        <!-- Custom main option input -->
                        <view class="form-group" style="margin-top: 30rpx;">
                            <text class="label">其他部位</text>
                            <input class="input tall-input" v-model="customBeforeOption" placeholder="请输入其他需要清洗的部位" />
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
                        <view class="selected-options" v-if="selectedCleaningItems.length > 0">
                            <view class="selected-option" v-for="item in selectedCleaningItems" :key="item.id">
                                <text class="option-label">{{ item.label }} 清洗后照片</text>

                                <!-- Side notes display (read-only) -->
                                <view class="form-group" v-if="sideNotes[item.id] && sideNotes[item.id].trim()"
                                    style="margin-bottom: 20rpx;">
                                    <text class="label">备注信息</text>
                                    <view class="notes-display">{{ sideNotes[item.id] }}</view>
                                </view>

                                <!-- Photo upload for custom options in after cleaning -->
                                <view class="custom-photo-section" v-if="item.value.startsWith('custom_')">
                                    <text class="sub-photo-label">{{ item.label }} 清洗后照片</text>
                                    <button class="photo-btn-add"
                                        @click="uploadCustomOptionPhotos('after', item.value)">
                                        📷 添加照片
                                    </button>
                                    <view class="photo-preview-grid"
                                        v-if="getCustomPhotoCount('after', item.value) > 0">
                                        <view class="photo-item"
                                            v-for="(photo, photoIndex) in customOptionPhotos.after[item.value]"
                                            :key="photoIndex">
                                            <image class="photo-image" :src="photo" mode="aspectFill"></image>
                                            <view class="photo-delete"
                                                @click="deleteCustomOptionPhoto('after', item.value, photoIndex)">×
                                            </view>
                                        </view>
                                    </view>
                                </view>

                                <!-- Photo upload for selected sub-options (based on before cleaning) -->
                                <view class="sub-photos-section" v-if="getSelectedSubOptions(item.id).length > 0">
                                    <view class="sub-photo-item" v-for="subOption in getSelectedSubOptions(item.id)"
                                        :key="subOption">
                                        <text class="sub-photo-label">{{ getSubOptionLabel(item.value, subOption) }}
                                            照片</text>
                                        <button class="photo-btn-add"
                                            @click="uploadDetailedPhotos('after', item.id, subOption)">
                                            📷 添加照片
                                        </button>
                                        <view class="photo-preview-grid"
                                            v-if="getDetailedPhotoCount('after', item.id, subOption) > 0">
                                            <view class="photo-item"
                                                v-for="(photo, photoIndex) in detailedAfterPhotos[item.id][subOption]"
                                                :key="photoIndex">
                                                <image class="photo-image" :src="photo" mode="aspectFill"></image>
                                                <view class="photo-delete"
                                                    @click="deleteDetailedPhoto('after', item.id, subOption, photoIndex)">
                                                    ×</view>
                                            </view>
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
                            <button class="photo-btn-add" @click="uploadWorkPhotos">📷 添加照片</button>
                            <view class="photo-preview-grid" v-if="workPhotos.length > 0">
                                <view class="photo-item" v-for="(photo, photoIndex) in workPhotos" :key="photoIndex">
                                    <image class="photo-image" :src="photo" mode="aspectFill"></image>
                                    <view class="photo-delete" @click="deleteWorkPhoto(photoIndex)">×</view>
                                </view>
                            </view>
                        </view>

                        <view class="button-group">
                            <button class="btn-secondary" @click="goToStep('afterCleaning')">上一步</button>
                            <button class="btn-save" @click="goToStep('environmentNotes')">下一步</button>
                        </view>
                    </view>

                    <!-- Step 4: 环境变更记录 -->
                    <view v-if="currentStep === 'environmentNotes'">
                        <view class="section-subtitle">完成清洗</view>

                        <!-- Summary Section -->
                        <view class="summary-section">
                            <view class="summary-title">📊 数据完成情况</view>
                            <view class="summary-item">
                                <text class="summary-label">清洗前照片:</text>
                                <text class="summary-value">已完成
                                    {{getBeforePhotosCount()}}/{{selectedCleaningItems.length}} 项</text>
                            </view>
                            <view class="summary-item">
                                <text class="summary-label">清洗后照片:</text>
                                <text class="summary-value">已完成
                                    {{getAfterPhotosCount()}}/{{selectedCleaningItems.length}} 项</text>
                            </view>
                            <view class="summary-item">
                                <text class="summary-label">工作照:</text>
                                <text class="summary-value">已上传 {{workPhotos.length}} 张</text>
                            </view>
                        </view>

                        <view class="form-group">
                            <text class="label">环境变更记录</text>
                            <textarea class="textarea" v-model="environmentNotes" placeholder="请记录环境变更情况、特殊注意事项等"
                                rows="8"></textarea>
                        </view>

                        <view class="button-group">
                            <button class="btn-secondary" @click="goToStep('workPhotos')">上一步</button>
                            <button class="btn-save" @click="saveCleaningRecord">保存记录</button>
                        </view>

                        <!-- Report Generation Button (for future) -->
                        <button class="btn-report" @click="generateReport" :disabled="true">
                            📄 生成报告 (开发中)
                        </button>
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

                // Photos for custom options (其他部位)
                customOptionPhotos: {
                    before: {}, // { custom_123456: [photo1, photo2] }
                    after: {}
                },

                // Selected cleaning items - now supports multiple of same type
                selectedCleaningItems: [], // Array of objects: [{id: unique_id, value: 'kitchen', label: '厨房'}]
                customBeforeOption: '',

                // Selected sub-options for each item (using unique IDs)
                selectedSubOptions: {}, // { item_id: ['environment', 'stove'] }

                // Side notes for each item (using unique IDs)
                sideNotes: {}, // { item_id: 'some notes' }

                // Detailed photos organized by item ID and sub-option
                detailedBeforePhotos: {}, // { item_id: { environment: [photos], stove: [photos] } }
                detailedAfterPhotos: {},

                workPhotos: [],
                environmentNotes: '',

                userInfo: {
                    name: '',
                    company: '',
                    isLoggedIn: false
                }
            };
        },

        onLoad() {
            // Get user info from storage (same way as 踏勘)
            this.userInfo = uni.getStorageSync('userInfo') || {
                name: '未知用户',
                company: '未知公司',
                isLoggedIn: false
            };

            if (!this.userInfo.isLoggedIn) {
                uni.navigateBack();
                return;
            }
        },

        onShow() {
            // Check if returning from annotation editor
            const annotatedPhoto = uni.getStorageSync('annotatedPhotoResult');
            const context = uni.getStorageSync('annotationContext');
            const reEditContext = uni.getStorageSync('reEditContext');

            if (annotatedPhoto && reEditContext) {
                // Re-editing existing photo
                const {
                    photoType,
                    type,
                    itemId,
                    subOption,
                    photoIndex
                } = reEditContext;

                if (photoType === 'detailed') {
                    // Replace in detailed photos
                    const photosObj = type === 'before' ? this.detailedBeforePhotos : this.detailedAfterPhotos;
                    if (photosObj[itemId] && photosObj[itemId][subOption]) {
                        this.$set(photosObj[itemId][subOption], photoIndex, annotatedPhoto);
                    }
                } else if (photoType === 'custom') {
                    // Replace in custom photos
                    if (this.customOptionPhotos[type] && this.customOptionPhotos[type][subOption]) {
                        this.$set(this.customOptionPhotos[type][subOption], photoIndex, annotatedPhoto);
                    }
                } else if (photoType === 'work') {
                    // Replace in work photos
                    this.$set(this.workPhotos, photoIndex, annotatedPhoto);
                }

                uni.removeStorageSync('annotatedPhotoResult');
                uni.removeStorageSync('reEditContext');

                uni.showToast({
                    title: '照片已更新',
                    icon: 'success'
                });

            } else if (annotatedPhoto && context) {
                // New photo annotation
                const {
                    photoType,
                    type,
                    itemId,
                    subOption
                } = context;

                if (photoType === 'detailed') {
                    const photosObj = type === 'before' ? this.detailedBeforePhotos : this.detailedAfterPhotos;

                    if (!photosObj[itemId]) {
                        this.$set(photosObj, itemId, {});
                    }
                    if (!photosObj[itemId][subOption]) {
                        this.$set(photosObj[itemId], subOption, []);
                    }
                    photosObj[itemId][subOption].push(annotatedPhoto);

                } else if (photoType === 'custom') {
                    if (!this.customOptionPhotos[type]) {
                        this.$set(this.customOptionPhotos, type, {});
                    }
                    if (!this.customOptionPhotos[type][subOption]) {
                        this.$set(this.customOptionPhotos[type], subOption, []);
                    }
                    this.customOptionPhotos[type][subOption].push(annotatedPhoto);

                } else if (photoType === 'work') {
                    this.workPhotos.push(annotatedPhoto);
                }

                uni.removeStorageSync('annotatedPhotoResult');
                uni.removeStorageSync('annotationContext');

                uni.showToast({
                    title: '照片已添加',
                    icon: 'success'
                });
            }
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

            // Add cleaning option (allows multiple of same type)
            addCleaningOption(value) {
                const uniqueId = Date.now() + '_' + Math.random().toString(36).substring(2, 9);
                const option = this.cleaningOptions.find(opt => opt.value === value);

                const newItem = {
                    id: uniqueId,
                    value: value,
                    label: option.label
                };

                this.selectedCleaningItems.push(newItem);

                // Initialize arrays for this specific item
                this.$set(this.selectedSubOptions, uniqueId, []);
                this.$set(this.detailedBeforePhotos, uniqueId, {});
                this.$set(this.detailedAfterPhotos, uniqueId, {});
                this.$set(this.sideNotes, uniqueId, '');
            },

            // Remove cleaning item
            removeCleaningItem(itemId) {
                const index = this.selectedCleaningItems.findIndex(item => item.id === itemId);
                if (index > -1) {
                    this.selectedCleaningItems.splice(index, 1);
                    delete this.selectedSubOptions[itemId];
                    delete this.detailedBeforePhotos[itemId];
                    delete this.detailedAfterPhotos[itemId];
                    delete this.sideNotes[itemId];
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

                    // Add the custom option as a selected item
                    this.addCleaningOption(customValue);
                    this.customBeforeOption = '';
                    this.$set(this.customOptionPhotos.before, customValue, []);
                    this.$set(this.customOptionPhotos.after, customValue, []);
                }
            },

            // Get sub-options for a specific area
            getSubOptionsForArea(area) {
                return this.cleaningSubOptions[area] || [];
            },

            // Check if sub-option is selected
            isSubOptionSelected(itemId, subOption) {
                return this.selectedSubOptions[itemId] && this.selectedSubOptions[itemId].includes(subOption);
            },

            // Toggle sub-option selection
            toggleSubOption(itemId, subOption) {
                if (!this.selectedSubOptions[itemId]) {
                    this.$set(this.selectedSubOptions, itemId, []);
                }

                const index = this.selectedSubOptions[itemId].indexOf(subOption);
                if (index > -1) {
                    this.selectedSubOptions[itemId].splice(index, 1);
                    // Remove photos for this sub-option
                    if (this.detailedBeforePhotos[itemId]) {
                        delete this.detailedBeforePhotos[itemId][subOption];
                    }
                    if (this.detailedAfterPhotos[itemId]) {
                        delete this.detailedAfterPhotos[itemId][subOption];
                    }
                } else {
                    this.selectedSubOptions[itemId].push(subOption);
                    // Initialize photo storage
                    if (!this.detailedBeforePhotos[itemId]) {
                        this.$set(this.detailedBeforePhotos, itemId, {});
                    }
                    if (!this.detailedAfterPhotos[itemId]) {
                        this.$set(this.detailedAfterPhotos, itemId, {});
                    }
                    this.$set(this.detailedBeforePhotos[itemId], subOption, []);
                    this.$set(this.detailedAfterPhotos[itemId], subOption, []);
                }
            },

            // Update side notes
            updateSideNotes(itemId, event) {
                this.$set(this.sideNotes, itemId, event.detail.value);
            },

            // Get selected sub-options for an item
            getSelectedSubOptions(itemId) {
                return this.selectedSubOptions[itemId] || [];
            },

            // Get sub-option label
            getSubOptionLabel(area, subOptionValue) {
                const subOptions = this.getSubOptionsForArea(area);
                const found = subOptions.find(opt => opt.value === subOptionValue);
                return found ? found.label : subOptionValue;
            },

            // Upload detailed photos
            uploadDetailedPhotos(type, itemId, subOption) {
                console.log(`Upload ${type} photos for ${itemId} - ${subOption}`);
                uni.chooseImage({
                    count: 1, // Take one photo at a time for better UX
                    sizeType: ['original', 'compressed'],
                    sourceType: ['album', 'camera'],
                    success: (res) => {
                        // Go directly to annotation editor
                        const photoPath = res.tempFilePaths[0];
                        this.openAnnotationEditor(photoPath, type, itemId, subOption);
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

            reEditPhoto(photoPath, photoType, type, itemId, subOption, photoIndex) {
                uni.setStorageSync('reEditContext', {
                    photoPath: photoPath,
                    photoType: photoType,
                    type: type,
                    itemId: itemId,
                    subOption: subOption,
                    photoIndex: photoIndex,
                    returnPage: '/pages/construction/index'
                });

                uni.navigateTo({
                    url: `/pages/annotation/editor?photo=${encodeURIComponent(photoPath)}`
                });
            },

            // Get detailed photo count
            getDetailedPhotoCount(type, itemId, subOption) {
                const photosObj = type === 'before' ? this.detailedBeforePhotos : this.detailedAfterPhotos;
                return photosObj[itemId] && photosObj[itemId][subOption] ? photosObj[itemId][subOption].length : 0;
            },

            // Upload photos for custom options (其他部位)
            uploadCustomOptionPhotos(type, option) {
                console.log(`Upload ${type} photos for custom option ${option}`);
                uni.chooseImage({
                    count: 1,
                    sizeType: ['original', 'compressed'],
                    sourceType: ['album', 'camera'],
                    success: (res) => {
                        const photoPath = res.tempFilePaths[0];
                        this.openAnnotationEditorForCustom(photoPath, type, option);
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

            // Get photo count for custom options
            getCustomPhotoCount(type, option) {
                return this.customOptionPhotos[type] && this.customOptionPhotos[type][option] ?
                    this.customOptionPhotos[type][option].length : 0;
            },

            // Upload work photos
            uploadWorkPhotos() {
                console.log('Upload work photos');
                uni.chooseImage({
                    count: 1,
                    sizeType: ['original', 'compressed'],
                    sourceType: ['album', 'camera'],
                    success: (res) => {
                        const photoPath = res.tempFilePaths[0];
                        this.openAnnotationEditorForWork(photoPath);
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
                return this.selectedCleaningItems.every(item => {
                    // For custom options, check if they have after photos
                    if (item.value.startsWith('custom_')) {
                        return this.getCustomPhotoCount('after', item.value) > 0;
                    }
                    // For regular options, check sub-options and their photos
                    const selectedSubs = this.getSelectedSubOptions(item.id);
                    return selectedSubs.every(subOption => {
                        return this.getDetailedPhotoCount('after', item.id, subOption) > 0;
                    });
                });
            },

            // Check if step is completed
            isStepCompleted(step) {
                switch (step) {
                    case 'beforeCleaning':
                        return this.selectedCleaningItems.length > 0 &&
                            this.selectedCleaningItems.every(item => {
                                // For custom options, check if they have photos
                                if (item.value.startsWith('custom_')) {
                                    return this.getCustomPhotoCount('before', item.value) > 0;
                                }
                                // For regular options, check sub-options and their photos
                                const selectedSubs = this.getSelectedSubOptions(item.id);
                                return selectedSubs.length > 0 && selectedSubs.every(subOption => {
                                    return this.getDetailedPhotoCount('before', item.id, subOption) > 0;
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

            // Get count of items with before photos
            getBeforePhotosCount() {
                return this.selectedCleaningItems.filter(item => {
                    if (item.value.startsWith('custom_')) {
                        return this.getCustomPhotoCount('before', item.value) > 0;
                    }
                    // For regular options, check if ANY sub-option has photos
                    const selectedSubs = this.getSelectedSubOptions(item.id);
                    if (selectedSubs.length === 0) return false;

                    // Count as complete if ANY sub-option has photos uploaded
                    return selectedSubs.some(subOption => {
                        return this.getDetailedPhotoCount('before', item.id, subOption) > 0;
                    });
                }).length;
            },

            // Get count of items with after photos
            getAfterPhotosCount() {
                return this.selectedCleaningItems.filter(item => {
                    if (item.value.startsWith('custom_')) {
                        return this.getCustomPhotoCount('after', item.value) > 0;
                    }
                    // For regular options, check if ANY sub-option has photos
                    const selectedSubs = this.getSelectedSubOptions(item.id);
                    if (selectedSubs.length === 0) return false;

                    // Count as complete if ANY sub-option has photos uploaded
                    return selectedSubs.some(subOption => {
                        return this.getDetailedPhotoCount('after', item.id, subOption) > 0;
                    });
                }).length;
            },

            // Delete photo for custom options
            deleteCustomOptionPhoto(type, option, photoIndex) {
                if (this.customOptionPhotos[type] && this.customOptionPhotos[type][option]) {
                    this.customOptionPhotos[type][option].splice(photoIndex, 1);
                    uni.showToast({
                        title: '照片已删除',
                        icon: 'success'
                    });
                }
            },

            // Delete detailed photo
            deleteDetailedPhoto(type, itemId, subOption, photoIndex) {
                const photosObj = type === 'before' ? this.detailedBeforePhotos : this.detailedAfterPhotos;
                if (photosObj[itemId] && photosObj[itemId][subOption]) {
                    photosObj[itemId][subOption].splice(photoIndex, 1);
                    uni.showToast({
                        title: '照片已删除',
                        icon: 'success'
                    });
                }
            },

            // Delete work photo
            deleteWorkPhoto(photoIndex) {
                this.workPhotos.splice(photoIndex, 1);
                uni.showToast({
                    title: '照片已删除',
                    icon: 'success'
                });
            },

            // Generate report (placeholder for future)
            generateReport() {
                uni.showToast({
                    title: '功能开发中，敬请期待',
                    icon: 'none',
                    duration: 2000
                });
            },

            // Open annotation editor for detailed photos
            openAnnotationEditor(photoPath, type, itemId, subOption) {
                uni.setStorageSync('annotationContext', {
                    photoPath: photoPath,
                    photoType: 'detailed',
                    type: type,
                    itemId: itemId,
                    subOption: subOption,
                    returnPage: '/pages/construction/index'
                });

                uni.navigateTo({
                    url: `/pages/annotation/editor?photo=${encodeURIComponent(photoPath)}`
                });
            },

            // Open annotation editor for custom option photos
            openAnnotationEditorForCustom(photoPath, type, option) {
                uni.setStorageSync('annotationContext', {
                    photoPath: photoPath,
                    photoType: 'custom',
                    type: type,
                    option: option,
                    returnPage: '/pages/construction/index'
                });

                uni.navigateTo({
                    url: `/pages/annotation/editor?photo=${encodeURIComponent(photoPath)}`
                });
            },

            // Open annotation editor for work photos
            openAnnotationEditorForWork(photoPath) {
                uni.setStorageSync('annotationContext', {
                    photoPath: photoPath,
                    photoType: 'work',
                    returnPage: '/pages/construction/index'
                });

                uni.navigateTo({
                    url: `/pages/annotation/editor?photo=${encodeURIComponent(photoPath)}`
                });
            },

            async saveCleaningRecord() {
                try {
                    // Validate field names before saving
                    const validateKeys = (obj, path = '') => {
                        for (let key in obj) {
                            if (key.includes('.') || key.includes('$')) {
                                console.error(`Illegal character in field: ${path}.${key}`);
                                throw new Error(`Field name contains illegal character: ${key}`);
                            }
                            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                                validateKeys(obj[key], `${path}.${key}`);
                            }
                        }
                    };

                    uni.showLoading({
                        title: '保存中...'
                    });

                    const db = uniCloud.database();

                    const record = {
                        workerName: this.userInfo.name,
                        workerCompany: this.userInfo.company,
                        cleaningDate: Date.now(),
                        selectedCleaningItems: this.selectedCleaningItems,
                        selectedSubOptions: this.selectedSubOptions,
                        sideNotes: this.sideNotes,
                        customOptionPhotos: this.customOptionPhotos,
                        detailedBeforePhotos: this.detailedBeforePhotos,
                        detailedAfterPhotos: this.detailedAfterPhotos,
                        workPhotos: this.workPhotos,
                        environmentNotes: this.environmentNotes,
                        userId: uni.getStorageSync('userId') || 'temp_user',
                        status: 'submitted'
                    };

                    // Validate before saving
                    validateKeys(record);

                    const result = await db.collection('construction_records').add(record);

                    uni.hideLoading();
                    uni.showToast({
                        title: '清洗记录保存成功',
                        icon: 'success'
                    });

                    uni.removeStorageSync('cleaningData');

                    setTimeout(() => {
                        uni.navigateBack();
                    }, 1500);

                } catch (error) {
                    uni.hideLoading();
                    console.error('保存失败:', error);
                    uni.showToast({
                        title: '保存失败: ' + error.message,
                        icon: 'none',
                        duration: 3000
                    });
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

        &:hover {
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

    .tall-input {
        min-height: 80rpx;
        height: 80rpx;
    }

    .small-textarea {
        min-height: 60rpx;
        height: 60rpx;
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

    .option-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20rpx;
    }

    .option-label {
        display: block;
        font-size: 32rpx;
        font-weight: bold;
        color: white;
        padding: 15rpx;
        border-radius: 8rpx;
        background-color: #007AFF;
        flex: 1;
        text-align: center;
    }

    .remove-btn {
        padding: 10rpx 20rpx;
        background-color: #ff4444;
        color: white;
        border: none;
        border-radius: 6rpx;
        font-size: 22rpx;
        margin-left: 15rpx;
        cursor: pointer;

        &:active {
            background-color: #cc0000;
        }
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

    .photo-btn-add {
        width: 100%;
        padding: 20rpx;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 12rpx;
        font-size: 28rpx;
        margin-bottom: 20rpx;
        cursor: pointer;

        &:active {
            opacity: 0.8;
        }
    }

    .photo-preview-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15rpx;
        margin-top: 20rpx;
    }

    .photo-item {
        position: relative;
        width: 100%;
        padding-bottom: 100%;
        border-radius: 8rpx;
        overflow: hidden;
        background-color: #f5f5f5;
    }

    .photo-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
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
        cursor: pointer;

        &:active {
            background-color: rgba(255, 0, 0, 0.8);
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

    .summary-section {
        background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
        padding: 30rpx;
        border-radius: 12rpx;
        margin-bottom: 30rpx;
        border: 2rpx solid #007AFF;
    }

    .summary-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #007AFF;
        margin-bottom: 20rpx;
        text-align: center;
    }

    .summary-item {
        display: flex;
        justify-content: space-between;
        padding: 15rpx 0;
        border-bottom: 1rpx solid #d0e8ff;

        &:last-child {
            border-bottom: none;
        }
    }

    .summary-label {
        font-size: 28rpx;
        color: #666;
    }

    .summary-value {
        font-size: 28rpx;
        font-weight: bold;
        color: #007AFF;
    }

    .btn-report {
        width: 100%;
        padding: 24rpx 0;
        border-radius: 12rpx;
        font-size: 32rpx;
        background-color: #34C759;
        color: white;
        border: none;
        margin-top: 20rpx;
        cursor: pointer;

        &:disabled {
            background-color: #ccc;
            cursor: not-allowed;
            opacity: 0.6;
        }

        &:active:not(:disabled) {
            background-color: #2da94a;
        }
    }
</style>