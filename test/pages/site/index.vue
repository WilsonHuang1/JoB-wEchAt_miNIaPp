<template>
    <view class="container">
        <view class="form-section">
            <view class="section-title">踏勘信息</view>

            <!-- Login status indicator -->
            <view class="login-status" v-if="userInfo.isLoggedIn">
                <text class="status-text">已登录: {{userInfo.name}} ({{userInfo.company}})</text>
            </view>

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

            <view class="form-group">
                <view class="cleaning-scope-section">
                    <text class="cleaning-scope-title" @click="toggleCleaningOptions">清洗范围
                        {{showCleaningOptions ? '▼' : '▶'}}</text>
                    <view class="cleaning-options" v-if="showCleaningOptions">
                        <label class="option-label" @click="toggleOption('横管')">
                            <checkbox value="横管" :checked="formData.qingxifanwei.includes('横管')" />
                            <text>横管</text>
                        </label>
                        <label class="option-label" @click="toggleOption('竖管')">
                            <checkbox value="竖管" :checked="formData.qingxifanwei.includes('竖管')" />
                            <text>竖管</text>
                        </label>
                        <label class="option-label" @click="toggleOption('风机')">
                            <checkbox value="风机" :checked="formData.qingxifanwei.includes('风机')" />
                            <text>风机</text>
                        </label>
                        <label class="option-label" @click="toggleOption('净化器')">
                            <checkbox value="净化器" :checked="formData.qingxifanwei.includes('净化器')" />
                            <text>净化器</text>
                        </label>
                        <label class="option-label" @click="toggleOption('其他')">
                            <checkbox value="其他" :checked="formData.qingxifanwei.includes('其他')" />
                            <text>其他</text>
                        </label>
                    </view>
                </view>
            </view>

            <!-- Specification inputs for each selected option -->
            <view class="specs-section" v-if="formData.qingxifanwei.length > 0">
                <view v-for="(option, optionIndex) in formData.qingxifanwei" :key="optionIndex" class="option-group">
                    <view class="option-header">
                        <text class="option-title">{{option}} 清洗范围</text>
                        <button class="add-entry-btn" @click="addEntry(option)"
                            v-if="option === '横管' || option === '竖管'">
                            + 添加条目
                        </button>
                    </view>

                    <!-- Multiple entries for 横管/竖管 -->
                    <view v-if="option === '横管' || option === '竖管'" class="entries-container">
                        <view v-for="(entry, entryIndex) in getMultipleEntries(option)" :key="`${option}-${entryIndex}`"
                            class="entry-item">
                            <view class="entry-header">
                                <text class="entry-title">{{option}} - 第{{entryIndex + 1}}段</text>
                                <button class="remove-entry-btn" @click="removeEntry(option, entryIndex)"
                                    v-if="getMultipleEntries(option).length > 1">
                                    删除
                                </button>
                            </view>

                            <!-- Entry fields -->
                            <view class="spec-field">
                                <text class="spec-label">管道材质 *</text>
                                <view class="pipe-material-section">
                                    <view class="pipe-material-options">
                                        <label class="material-option"
                                            @click="selectEntryMaterial(option, entryIndex, '镀锌铁管')">
                                            <radio :checked="entry.material === '镀锌铁管'" />
                                            <text>镀锌铁管</text>
                                        </label>
                                        <label class="material-option"
                                            @click="selectEntryMaterial(option, entryIndex, '不锈钢')">
                                            <radio :checked="entry.material === '不锈钢'" />
                                            <text>不锈钢</text>
                                        </label>
                                        <label class="material-option"
                                            @click="selectEntryMaterial(option, entryIndex, '其他')">
                                            <radio :checked="entry.material === '其他'" />
                                            <text>其他</text>
                                        </label>
                                    </view>
                                    <input v-if="entry.material === '其他'" class="spec-input other-material-input"
                                        v-model="entry.otherMaterial" placeholder="请输入其他材质类型" />
                                </view>
                            </view>

                            <view class="spec-field">
                                <text class="spec-label">型号规格 *</text>
                                <input class="spec-input" v-model="entry.model" placeholder="请输入型号规格" />
                            </view>

                            <view class="spec-field">
                                <text class="spec-label">单位</text>
                                <text class="unit-text">米(m)</text>
                            </view>

                            <view class="spec-field">
                                <text class="spec-label">长度 *</text>
                                <input class="spec-input" v-model="entry.quantity" placeholder="请输入长度" type="number" />
                            </view>

                            <view class="spec-field">
                                <text class="spec-label">作业频次 *</text>
                                <input class="spec-input" v-model="entry.frequency" placeholder="请输入作业频次" />
                            </view>

                            <view class="spec-field">
                                <text class="spec-label">拍照(清洗前) *</text>
                                <view class="photo-section">
                                    <button class="photo-btn" @click="takeEntryPhoto(option, entryIndex, 'before')">📷
                                        拍照</button>
                                    <text class="photo-count" v-if="entry.photoBefore.length > 0">已拍
                                        {{entry.photoBefore.length}} 张</text>
                                </view>
                            </view>
                        </view>
                    </view>

                    <!-- Single entry for other options (风机, 净化器, 其他) -->
                    <view v-else class="single-entry">
                        <view class="spec-item">
                            <!-- 具体位置 (for 风机, 其他) -->
                            <view class="spec-field" v-if="needsField(option, 'position')">
                                <text class="spec-label">具体位置 {{isRequired(option, 'position') ? '*' : ''}}</text>
                                <input class="spec-input" v-model="getSpecs(option).position" placeholder="请输入具体位置" />
                            </view>

                            <!-- 型号规格 (for 风机, 其他) -->
                            <view class="spec-field" v-if="needsField(option, 'model')">
                                <text class="spec-label">型号规格 {{isRequired(option, 'model') ? '*' : ''}}</text>
                                <input class="spec-input" v-model="getSpecs(option).model" placeholder="请输入型号规格" />
                            </view>

                            <!-- 单位 (auto-filled based on selection) -->
                            <view class="spec-field">
                                <text class="spec-label">单位 *</text>
                                <view v-if="option === '其他'" class="unit-selection">
                                    <view class="unit-tabs">
                                        <button class="unit-tab" :class="{ active: getSpecs(option).unit === '米(m)' }"
                                            @click="selectUnit(option, '米(m)')">
                                            米(m)
                                        </button>
                                        <button class="unit-tab" :class="{ active: getSpecs(option).unit === '台' }"
                                            @click="selectUnit(option, '台')">
                                            台
                                        </button>
                                    </view>
                                </view>
                                <view v-else class="unit-display">
                                    <text class="unit-text">{{getUnitForOption(option)}}</text>
                                </view>
                            </view>

                            <!-- 数量 (required for all) -->
                            <view class="spec-field">
                                <text class="spec-label">数量 *</text>
                                <input class="spec-input" v-model="getSpecs(option).quantity" placeholder="请输入数量"
                                    type="number" />
                            </view>

                            <!-- 作业频次 (required for all) -->
                            <view class="spec-field">
                                <text class="spec-label">作业频次 *</text>
                                <input class="spec-input" v-model="getSpecs(option).frequency" placeholder="请输入作业频次" />
                            </view>

                            <!-- 拍照(清洗前) -->
                            <view class="spec-field">
                                <text class="spec-label">拍照(清洗前) *</text>
                                <view class="photo-section">
                                    <button class="photo-btn" @click="takePhoto(option, 'before')">📷 拍照</button>
                                    <text class="photo-count" v-if="getSpecs(option).photoBefore.length > 0">已拍
                                        {{getSpecs(option).photoBefore.length}} 张</text>
                                </view>
                            </view>
                        </view>
                    </view>
                </view>
            </view>

            <view class="button-group">
                <button class="btn-save" @click="showPreview">预览保存</button>
                <button class="btn-cancel" @click="goBack">返回</button>
            </view>

            <view class="action-buttons">
                <button class="export-btn" @click="exportAsExcel">导出Excel</button>
            </view>

        </view>
    </view>
</template>

<script>
    const db = uniCloud.database()

    export default {
        data() {
            return {
                showCleaningOptions: false,
                currentLocation: null,
                workerOptions: [],
                multipleEntries: {},

                userInfo: {
                    name: '',
                    company: '',
                    isLoggedIn: false,
                    userId: ''
                },
                formData: {
                    guishu: '',
                    didian: '',
                    tankanyuan: '',
                    mingcheng: '',
                    qingxifanwei: [],
                    qingxichangdu: ''
                },
                specDetails: {},
            };
        },
        onLoad() {
            this.wechatLogin();
            this.loadWorkerData();
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
                        this.userInfo.userId = demoOpenId; // Add this line
                        this.userInfo.isLoggedIn = true;

                        this.formData.guishu = userData.company;
                        this.formData.tankanyuan = userData.name;

                        uni.showToast({
                            title: `欢迎 ${userData.name}`,
                            icon: 'success'
                        });
                    },
                    fail: (err) => {
                        console.log('微信登录失败', err);
                        uni.showToast({
                            title: '登录失败，使用演示数据',
                            icon: 'none'
                        });
                        this.setDemoData();
                    }
                });
            },

            // Set demo data directly
            setDemoData() {
                this.userInfo.name = '演示用户';
                this.userInfo.company = '演示建筑公司';
                this.userInfo.userId = 'demo_user';
                this.userInfo.isLoggedIn = true;
                this.formData.guishu = '演示建筑公司';
                this.formData.tankanyuan = '演示用户';
            },

            getLocation() {
                uni.showLoading({
                    title: '获取位置中...'
                })
                uni.getLocation({
                    type: 'gcj02',
                    geocode: true,
                    success: (res) => {
                        this.currentLocation = res
                        this.formData.didian = res.address || `纬度:${res.latitude}, 经度:${res.longitude}`
                        uni.hideLoading()
                        uni.showToast({
                            title: '位置获取成功',
                            icon: 'success'
                        })
                    },
                    fail: (error) => {
                        uni.hideLoading()
                        console.error('获取位置失败:', error)
                        uni.showToast({
                            title: '获取位置失败，请检查定位权限',
                            icon: 'none'
                        })
                    }
                })
            },

            // Get automatic unit based on option
            getUnitForOption(option) {
                const unitMap = {
                    '横管': '米(m)',
                    '竖管': '米(m)',
                    '风机': '台',
                    '净化器': '台',
                    '其他': '米(m)' // Default to 米(m) for 其他
                }
                return unitMap[option] || '台'
            },

            // Select unit for 其他 option
            selectUnit(option, unit) {
                const specs = this.getSpecs(option)
                specs.unit = unit
            },

            toggleCleaningOptions() {
                this.showCleaningOptions = !this.showCleaningOptions;
            },

            toggleOption(value) {
                const index = this.formData.qingxifanwei.indexOf(value);
                if (index > -1) {
                    this.formData.qingxifanwei.splice(index, 1);
                } else {
                    this.formData.qingxifanwei.push(value);
                }
            },

            // Get or create specs object for an option
            getSpecs(option) {
                if (!this.specDetails[option]) {
                    // Get the default unit without calling getSpecs again
                    let defaultUnit = '台';
                    if (option === '横管' || option === '竖管') {
                        defaultUnit = '米(m)';
                    } else if (option === '风机' || option === '净化器') {
                        defaultUnit = '台';
                    } else if (option === '其他') {
                        defaultUnit = '米(m)';
                    }

                    this.$set(this.specDetails, option, {
                        position: '',
                        material: '',
                        otherMaterial: '',
                        model: '',
                        unit: defaultUnit, // Use the calculated default unit
                        quantity: '',
                        frequency: '',
                        photoBefore: [],
                        photoAfter: []
                    });
                }
                return this.specDetails[option];
            },

            // Check if field is needed for this option
            needsField(option, field) {
                const fieldRules = {
                    'position': ['风机', '其他'], // 风机 and 其他 need 具体位置
                    'model': ['横管', '竖管', '风机', '其他'] // 净化器 doesn't need 型号规格, others do
                };
                return fieldRules[field] ? fieldRules[field].includes(option) : true;
            },

            // Handle material selection
            selectMaterial(option, material) {
                const specs = this.getSpecs(option);
                specs.material = material;
                if (material !== '其他') {
                    specs.otherMaterial = ''; // Clear other material input if not "其他"
                }
            },

            // Get multiple entries for an option
            getMultipleEntries(option) {
                if (!this.multipleEntries) {
                    this.multipleEntries = {}
                }
                if (!this.multipleEntries[option]) {
                    this.multipleEntries[option] = [this.createNewEntry(option)]
                }
                return this.multipleEntries[option]
            },

            // Create a new entry
            createNewEntry(option) {
                return {
                    material: '',
                    otherMaterial: '',
                    model: '',
                    quantity: '',
                    frequency: '',
                    photoBefore: [],
                    photoAfter: []
                }
            },

            // Add new entry
            addEntry(option) {
                const entries = this.getMultipleEntries(option)
                entries.push(this.createNewEntry(option))
                uni.showToast({
                    title: '已添加新条目',
                    icon: 'success'
                })
            },

            // Remove entry
            removeEntry(option, entryIndex) {
                const entries = this.getMultipleEntries(option)
                if (entries.length > 1) {
                    entries.splice(entryIndex, 1)
                    uni.showToast({
                        title: '条目已删除',
                        icon: 'success'
                    })
                }
            },

            // Select material for specific entry
            selectEntryMaterial(option, entryIndex, material) {
                const entries = this.getMultipleEntries(option)
                entries[entryIndex].material = material
                if (material !== '其他') {
                    entries[entryIndex].otherMaterial = ''
                }
            },

            // Take photo for specific entry
            takeEntryPhoto(option, entryIndex, type) {
                uni.chooseImage({
                    count: 1,
                    success: (res) => {
                        const entries = this.getMultipleEntries(option)
                        if (type === 'before') {
                            entries[entryIndex].photoBefore.push(res.tempFilePaths[0])
                        } else {
                            entries[entryIndex].photoAfter.push(res.tempFilePaths[0])
                        }
                        uni.showToast({
                            title: '照片添加成功',
                            icon: 'success'
                        })
                    },
                    fail: () => {
                        uni.showToast({
                            title: '拍照失败',
                            icon: 'none'
                        })
                    }
                })
            },
            // Check if field is required (marked with *)
            isRequired(option, field) {
                // For 其他, make position and model optional (no asterisk)
                if (option === '其他' && (field === 'position' || field === 'model')) {
                    return false;
                }
                return this.needsField(option, field);
            },

            // Handle photo taking
            takePhoto(option, type) {
                uni.chooseImage({
                    count: 1,
                    success: (res) => {
                        const specs = this.getSpecs(option);
                        if (type === 'before') {
                            specs.photoBefore.push(res.tempFilePaths[0]);
                        } else {
                            specs.photoAfter.push(res.tempFilePaths[0]);
                        }
                        uni.showToast({
                            title: '照片添加成功',
                            icon: 'success'
                        });
                    },
                    fail: () => {
                        uni.showToast({
                            title: '拍照失败',
                            icon: 'none'
                        });
                    }
                });
            },

            // Replace showPreview method
            showPreview() {
                // Validate required fields first
                if (!this.formData.guishu || !this.formData.tankanyuan || !this.formData.mingcheng) {
                    uni.showToast({
                        title: '请填写必填项目',
                        icon: 'error'
                    })
                    return
                }

                // Generate summary data
                const summaryData = this.generateSummaryData()

                // Navigate to preview page with data
                uni.navigateTo({
                    url: '/pages/site/preview',
                    success: (res) => {
                        // Pass data to preview page
                        res.eventChannel.emit('previewData', {
                            summaryData,
                            formData: this.formData,
                            specDetails: this.specDetails,
                            multipleEntries: this.multipleEntries,
                            currentLocation: this.currentLocation,
                            userInfo: this.userInfo
                        })
                    }
                })
            },

            // Generate summary statistics
            generateSummaryData() {
                const summary = {
                    基本信息: {
                        归属: this.formData.guishu,
                        踏勘人员: this.formData.tankanyuan,
                        地点: this.formData.didian,
                        名称: this.formData.mingcheng
                    },
                    清洗范围统计: {},
                    详细条目: []
                }

                // Count items by type
                let totalItems = 0
                let totalLength = 0 // For 横管/竖管
                let totalUnits = 0 // For 风机/净化器/其他

                this.formData.qingxifanwei.forEach(option => {
                    if (option === '横管' || option === '竖管') {
                        // Multiple entries
                        const entries = this.getMultipleEntries(option)
                        const count = entries.length
                        const length = entries.reduce((sum, entry) => sum + (parseFloat(entry.quantity) || 0),
                            0)

                        summary.清洗范围统计[option] = `${count}段, 总长度: ${length}米`
                        totalItems += count
                        totalLength += length

                        entries.forEach((entry, index) => {
                            summary.详细条目.push({
                                类型: `${option} - 第${index + 1}段`,
                                材质: entry.material === '其他' ? entry.otherMaterial : entry
                                    .material,
                                规格: entry.model,
                                数量: `${entry.quantity}米`,
                                频次: entry.frequency,
                                照片: `${entry.photoBefore.length}张`
                            })
                        })
                    } else {
                        // Single entries
                        const specs = this.getSpecs(option)
                        const quantity = parseFloat(specs.quantity) || 0

                        summary.清洗范围统计[option] = `${quantity}${specs.unit}`
                        totalItems += 1
                        totalUnits += quantity

                        summary.详细条目.push({
                            类型: option,
                            位置: specs.position || '-',
                            规格: specs.model || '-',
                            数量: `${specs.quantity}${specs.unit}`,
                            频次: specs.frequency,
                            照片: `${specs.photoBefore.length}张`
                        })
                    }
                })

                summary.总计 = {
                    总条目数: totalItems,
                    管道总长度: totalLength > 0 ? `${totalLength}米` : '无',
                    设备总数: totalUnits > 0 ? `${totalUnits}台` : '无'
                }

                return summary
            },

            async loadWorkerData() {
                try {
                    const result = await db.collection('workers')
                        .where({
                            isActive: true
                        })
                        .orderBy('department', 'asc')
                        .get()

                    this.workerOptions = result.result.data.map(worker => ({
                        value: worker.name,
                        text: `${worker.name} - ${worker.department}`,
                        department: worker.department
                    }))
                } catch (error) {
                    console.error('加载工作人员失败:', error)
                    this.workerOptions = [{
                            value: '张三',
                            text: '张三 - 技术部'
                        },
                        {
                            value: '李四',
                            text: '李四 - 施工部'
                        },
                        {
                            value: '王五',
                            text: '王五 - 质检部'
                        }
                    ]
                }
            },

            async exportAsExcel() {
                try {
                    const excelData = [
                        ['踏勘记录表'],
                        ['归属', this.formData.guishu],
                        ['踏勘人员', this.formData.tankanyuan],
                        ['地点', this.formData.didian],
                        ['名称', this.formData.mingcheng],
                        ['清洗范围', this.formData.qingxifanwei.join(', ')],
                        ['创建时间', new Date().toLocaleString()],
                        [],
                        ['清洗范围详细信息:']
                    ]

                    this.formData.qingxifanwei.forEach(option => {
                        const specs = this.specDetails[option]
                        if (specs) {
                            excelData.push([option + ' - 规格信息'])
                            Object.entries(specs).forEach(([key, value]) => {
                                if (key !== 'photoBefore' && key !== 'photoAfter' && value) {
                                    excelData.push(['  ' + key, value])
                                }
                            })
                            excelData.push([])
                        }
                    })

                    uni.showToast({
                        title: '导出功能开发中',
                        icon: 'none'
                    })
                } catch (error) {
                    console.error('导出失败:', error)
                    uni.showToast({
                        title: '导出失败',
                        icon: 'error'
                    })
                }
            },

            goBack() {
                uni.navigateBack();
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

    .input {
        width: calc(100% - 40rpx);
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

    .location-wrapper {
        display: flex;
        gap: 20rpx;
    }

    .location-input {
        flex: 1;
    }

    .location-btn {
        width: 80rpx;
        height: 80rpx;
        background: #007aff;
        color: white;
        border: none;
        border-radius: 8rpx;
        font-size: 24rpx;
    }

    .cleaning-scope-section {
        border: 2rpx solid #e5e5e5;
        border-radius: 12rpx;
        background-color: #fafafa;
        overflow: hidden;
    }

    .cleaning-scope-title {
        display: block;
        padding: 20rpx;
        background-color: #f0f0f0;
        color: #333;
        font-size: 28rpx;
        font-weight: 500;
        cursor: pointer;
        user-select: none;

        &:active {
            background-color: #e0e0e0;
        }
    }

    .cleaning-options {
        padding: 20rpx;
        display: flex;
        flex-direction: column;
        gap: 15rpx;
    }

    .option-label {
        display: flex;
        align-items: center;
        gap: 10rpx;
        cursor: pointer;

        checkbox {
            transform: scale(1.2);
        }

        text {
            font-size: 28rpx;
            color: #333;
        }
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

    .input-with-unit {
        display: flex;
        align-items: center;
        border: 2rpx solid #e5e5e5;
        border-radius: 12rpx;
        background-color: #fafafa;

        &:focus-within {
            border-color: #007AFF;
            background-color: white;
        }
    }

    .unit-input {
        flex: 1;
        border: none;
        background: transparent;
    }

    .unit {
        padding: 20rpx;
        color: #666;
        font-size: 28rpx;
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

    .readonly-input {
        background-color: #f8f8f8;
        color: #666;
        cursor: not-allowed;
    }

    .readonly-field {
        padding: 20rpx;
        background-color: #f0f0f0;
        border: 2rpx solid #d0d0d0;
        border-radius: 12rpx;
        min-height: 40rpx;
        display: flex;
        align-items: center;
    }

    .readonly-text {
        color: #333;
        font-size: 28rpx;
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

    .pipe-material-section {
        display: flex;
        flex-direction: column;
        gap: 10rpx;
    }

    .pipe-material-options {
        display: flex;
        flex-direction: column;
        gap: 8rpx;
    }

    .material-option {
        display: flex;
        align-items: center;
        gap: 8rpx;
        cursor: pointer;

        radio {
            transform: scale(1.1);
        }

        text {
            font-size: 24rpx;
            color: #333;
        }
    }

    .other-material-input {
        margin-top: 10rpx;
        border-color: #007AFF;
    }

    .action-buttons {
        margin-top: 20rpx;

        .export-btn {
            width: 100%;
            height: 88rpx;
            background: linear-gradient(135deg, #007AFF, #0056D6);
            color: white;
            border: none;
            border-radius: 12rpx;
            font-size: 32rpx;
            font-weight: bold;
        }
    }

    .unit-selection {
        .unit-tabs {
            display: flex;
            gap: 10rpx;
        }

        .unit-tab {
            flex: 1;
            padding: 15rpx;
            border: 2rpx solid #ddd;
            background: white;
            border-radius: 8rpx;
            font-size: 24rpx;

            &.active {
                background: #007AFF;
                color: white;
                border-color: #007AFF;
            }
        }
    }

    .unit-display {
        padding: 15rpx 20rpx;
        background: #f0f0f0;
        border-radius: 8rpx;

        .unit-text {
            font-size: 26rpx;
            color: #333;
            font-weight: bold;
        }
    }

    .option-group {
        border: 2rpx solid #e5e5e5;
        border-radius: 12rpx;
        margin-bottom: 20rpx;
        overflow: hidden;
    }

    .option-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20rpx;
        background: #f8f8f8;
        border-bottom: 1rpx solid #e5e5e5;
    }

    .option-title {
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
    }

    .add-entry-btn {
        padding: 8rpx 16rpx;
        background: #007AFF;
        color: white;
        border: none;
        border-radius: 6rpx;
        font-size: 22rpx;
    }

    .entries-container {
        padding: 20rpx;
    }

    .entry-item {
        border: 1rpx solid #ddd;
        border-radius: 8rpx;
        margin-bottom: 15rpx;
        padding: 15rpx;
        background: #fafafa;
    }

    .entry-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15rpx;
    }

    .entry-title {
        font-size: 24rpx;
        font-weight: bold;
        color: #666;
    }

    .remove-entry-btn {
        padding: 6rpx 12rpx;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 4rpx;
        font-size: 20rpx;
    }

    .single-entry {
        padding: 20rpx;
    }

    .summary-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
    }

    .modal-content {
        position: relative;
        width: 90%;
        max-height: 85%;
        background: white;
        border-radius: 16rpx;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 30rpx;
        border-bottom: 1rpx solid #e5e5e5;
        background: #f8f8f8;
    }

    .modal-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
    }

    .close-btn {
        width: 60rpx;
        height: 60rpx;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 40rpx;
        line-height: 1;
    }

    .modal-body {
        flex: 1;
        padding: 20rpx;
    }

    .summary-section {
        margin-bottom: 30rpx;
    }

    .section-header {
        font-size: 28rpx;
        font-weight: bold;
        color: #007AFF;
        margin-bottom: 15rpx;
        display: block;
    }

    .info-grid,
    .stats-grid,
    .totals-grid {
        display: flex;
        flex-direction: column;
        gap: 8rpx;
    }

    .info-item,
    .total-item {
        display: flex;
        justify-content: space-between;
        padding: 8rpx 12rpx;
        background: #f5f5f5;
        border-radius: 6rpx;
    }

    .info-label,
    .total-label {
        font-size: 24rpx;
        color: #666;
    }

    .info-value,
    .total-value {
        font-size: 24rpx;
        color: #333;
        font-weight: bold;
    }

    .stat-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12rpx;
        border: 1rpx solid #e0e0e0;
        border-radius: 8rpx;
        background: white;
    }

    .stat-type {
        font-size: 26rpx;
        color: #333;
        font-weight: bold;
    }

    .stat-count {
        font-size: 24rpx;
        color: #007AFF;
    }

    .details-list {
        display: flex;
        flex-direction: column;
        gap: 12rpx;
    }

    .detail-item {
        border: 1rpx solid #ddd;
        border-radius: 8rpx;
        overflow: hidden;
    }

    .detail-header {
        background: #f0f8ff;
        padding: 10rpx 15rpx;
    }

    .detail-type {
        font-size: 24rpx;
        font-weight: bold;
        color: #007AFF;
    }

    .detail-info {
        padding: 12rpx 15rpx;
        display: flex;
        flex-direction: column;
        gap: 4rpx;
    }

    .detail-text {
        font-size: 22rpx;
        color: #666;
    }

    .modal-footer {
        display: flex;
        gap: 20rpx;
        padding: 20rpx 30rpx;
        border-top: 1rpx solid #e5e5e5;
        background: #f8f8f8;
    }

    .btn-back,
    .btn-confirm {
        flex: 1;
        height: 80rpx;
        border-radius: 12rpx;
        font-size: 28rpx;
        border: none;
    }

    .btn-back {
        background: #f0f0f0;
        color: #666;
    }

    .btn-confirm {
        background: #007AFF;
        color: white;
    }
</style>