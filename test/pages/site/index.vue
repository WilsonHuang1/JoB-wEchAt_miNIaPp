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
	      <text class="cleaning-scope-title" @click="toggleCleaningOptions">清洗范围 {{showCleaningOptions ? '▼' : '▶'}}</text>
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
	    <view v-for="(option, index) in formData.qingxifanwei" :key="index" class="spec-item">
	      <view class="spec-title">{{option}} - 规格信息</view>
	      
	      <!-- 具体位置 (blank for 横管,竖管,净化器,其他) -->
	      <view class="spec-field" v-if="needsField(option, 'position')">
	        <text class="spec-label">具体位置 {{isRequired(option, 'position') ? '*' : ''}}</text>
	        <input class="spec-input" v-model="getSpecs(option).position" placeholder="请输入具体位置" />
	      </view>
		  
		  <!-- 管道材质 (for 横管,竖管 only) -->
		  <view class="spec-field" v-if="option === '横管' || option === '竖管'">
		    <text class="spec-label">管道材质 *</text>
		    <view class="pipe-material-section">
		      <view class="pipe-material-options">
		        <label class="material-option" @click="selectMaterial(option, '镀锌铁管')">
		          <radio :checked="getSpecs(option).material === '镀锌铁管'" />
		          <text>镀锌铁管</text>
		        </label>
		        <label class="material-option" @click="selectMaterial(option, '不锈钢')">
		          <radio :checked="getSpecs(option).material === '不锈钢'" />
		          <text>不锈钢</text>
		        </label>
		        <label class="material-option" @click="selectMaterial(option, '其他')">
		          <radio :checked="getSpecs(option).material === '其他'" />
		          <text>其他</text>
		        </label>
		      </view>
		      <!-- 其他材质输入框 -->
		      <input 
		        v-if="getSpecs(option).material === '其他'" 
		        class="spec-input other-material-input" 
		        v-model="getSpecs(option).otherMaterial" 
		        placeholder="请输入其他材质类型" 
		      />
		    </view>
		  </view>
	      
	      <!-- 型号规格 (blank for 净化器,其他) -->
	      <view class="spec-field" v-if="needsField(option, 'model')">
	        <text class="spec-label">型号规格 {{isRequired(option, 'model') ? '*' : ''}}</text>
	        <input class="spec-input" v-model="getSpecs(option).model" placeholder="请输入型号规格" />
	      </view>
	      
	      <!-- 单位 (required for all except when specified) -->
	      <view class="spec-field">
	        <text class="spec-label">单位 *</text>
	        <input class="spec-input" v-model="getSpecs(option).unit" placeholder="请输入单位" />
	      </view>
	      
	      <!-- 数量 (required for all) -->
	      <view class="spec-field">
	        <text class="spec-label">数量 *</text>
	        <input class="spec-input" v-model="getSpecs(option).quantity" placeholder="请输入数量" type="number" />
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
	          <text class="photo-count" v-if="getSpecs(option).photoBefore.length > 0">已拍 {{getSpecs(option).photoBefore.length}} 张</text>
	        </view>
	      </view>
	      
	      <!-- 拍照 -->
	      <!-- <view class="spec-field">
	        <text class="spec-label">拍照 *</text>
	        <view class="photo-section">
	          <button class="photo-btn" @click="takePhoto(option, 'after')">📷 拍照</button>
	          <text class="photo-count" v-if="getSpecs(option).photoAfter.length > 0">已拍 {{getSpecs(option).photoAfter.length}} 张</text>
	        </view>
	      </view> -->
	    </view>
	  </view>
	  
	  <!-- <view class="form-group">
	    <text class="label">清洗长度 (米)</text>
	    <input class="input" v-model="formData.qingxichangdu" placeholder="请输入清洗长度 (米)" />
	  </view> -->
	  
	  <view class="button-group">
	    <button class="btn-save" @click="save">保存</button>
	    <button class="btn-cancel" @click="goBack">返回</button>
	  </view>
      
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
	  showCleaningOptions: false,
	  userInfo: {
		name: '',
		company: '',
		isLoggedIn: false
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
  },
  methods: {
	// Demo user data - replace with real API call later
	getDemoUserData(openid) {
	  const demoUsers = {
	    'demo_user_1': { name: '张三', company: '北京建筑公司' },
	    'demo_user_2': { name: '李四', company: '上海工程集团' },
	    'demo_user_3': { name: '王五', company: '广州施工有限公司' }
	  };
	  return demoUsers[openid] || { name: '测试用户', company: '演示公司' };
	},

	// WeChat login
	wechatLogin() {
	  uni.login({
	    provider: 'weixin',
	    success: (loginRes) => {
	      console.log('微信登录成功', loginRes.code);
	      // In real app, send loginRes.code to your server to get user info
	      // For demo, use a random demo user
	      const demoOpenId = 'demo_user_' + Math.floor(Math.random() * 3 + 1);
	      const userData = this.getDemoUserData(demoOpenId);
	      
	      this.userInfo.name = userData.name;
	      this.userInfo.company = userData.company;
	      this.userInfo.isLoggedIn = true;
	      
	      // Auto-fill form fields
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
	      // Use demo data even if login fails
	      this.setDemoData();
	    }
	  });
	},

	// Set demo data directly
	setDemoData() {
	  this.userInfo.name = '演示用户';
	  this.userInfo.company = '演示建筑公司';
	  this.userInfo.isLoggedIn = true;
	  this.formData.guishu = '演示建筑公司';
	  this.formData.tankanyuan = '演示用户';
	},

    getLocation() {
      uni.getLocation({
        type: 'wgs84',
        success: (res) => {
          this.formData.didian = `纬度:${res.latitude}, 经度:${res.longitude}`;
          uni.showToast({ title: '位置获取成功', icon: 'success' });
        },
        fail: () => {
          uni.showToast({ title: '获取位置失败', icon: 'none' });
        }
      });
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
	    this.$set(this.specDetails, option, {
	      position: '',
		  material: '',
		  otherMaterial: '',
	      model: '',
	      unit: '',
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
	      uni.showToast({ title: '照片添加成功', icon: 'success' });
	    },
	    fail: () => {
	      uni.showToast({ title: '拍照失败', icon: 'none' });
	    }
	  });
	},
    
    save() {
      console.log('保存踏勘数据:', this.formData);
      uni.showToast({ title: '保存成功', icon: 'success' });
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

.btn-save, .btn-cancel {
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
</style>