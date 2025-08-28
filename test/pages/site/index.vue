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
	    <view class="readonly-field">
	      <text class="readonly-text">{{formData.guishu || '获取中...'}}</text>
	    </view>
	  </view>
	  
	  <view class="form-group">
	    <text class="label">踏勘人员</text>
	    <view class="readonly-field">
	      <text class="readonly-text">{{formData.tankanyuan || '获取中...'}}</text>
	    </view>
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
	    <text class="label">清洗范围</text>
	    <input class="input" v-model="formData.qingxifanwei" placeholder="请输入清洗范围" />
	  </view>
	  
	  <view class="form-group">
	    <text class="label">清洗长度 (米)</text>
	    <input class="input" v-model="formData.qingxichangdu" placeholder="请输入清洗长度 (米)" />
	  </view>
	  
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
        qingxifanwei: '',
        qingxichangdu: ''
      },
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
</style>