<template>
  <view class="container">
    <view class="header">
      <text class="title">业务管理系统</text>
    </view>
    
    <view class="main-tabs">
      <view class="tab-item survey" @click="goToSurvey">
        <view class="tab-icon">📋</view>
        <text class="tab-title">踏勘</text>
        <text class="tab-desc">现场调研与信息收集</text>
      </view>
      
      <view class="tab-item construction" @click="goToConstruction">
        <view class="tab-icon">🏗️</view>
        <text class="tab-title">施工</text>
        <text class="tab-desc">施工管理与进度跟踪</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      
    }
  },
  methods: {
    goToSurvey() {
      uni.navigateTo({
        url: '/pages/site/index'
      })
    },
    goToConstruction() {
      uni.navigateTo({
        url: '/pages/construction/index'
      })
    }
  }
}
</script>

<style lang="scss">
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  text-align: center;
  padding: 40rpx 0 60rpx 0;
  
  .title {
    font-size: 48rpx;
    font-weight: bold;
    color: #333;
  }
}

.main-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 40rpx;
  padding: 0 40rpx;
}

.tab-item {
  background: white;
  border-radius: 24rpx;
  padding: 80rpx 40rpx;
  box-shadow: 0 6rpx 20rpx rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: all 0.3s ease;
  min-height: 300rpx;
  justify-content: center;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 15rpx rgba(0,0,0,0.15);
  }
}

.tab-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.tab-title {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.tab-desc {
  font-size: 28rpx;
  color: #666;
  line-height: 1.4;
}

.survey {
  border-left: 12rpx solid #34C759;
}

.construction {
  border-left: 12rpx solid #FF9500;
}
</style>