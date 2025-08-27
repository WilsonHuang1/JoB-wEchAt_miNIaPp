<template>
  <view class="container">
    <view class="section-header">
      <text class="section-title">营业管理</text>
    </view>
    
    <view class="menu-list">
      <view class="menu-item" @click="goToBasicInfo">
        <view class="menu-icon">📝</view>
        <view class="menu-content">
          <text class="menu-title">基础信息录入</text>
          <text class="menu-desc">商业外观信息、位置、名称、外观、停车场入口、价格、停车反应及提供口碑</text>
        </view>
        <text class="menu-arrow">></text>
      </view>
      
      <view class="menu-item" @click="goToCustomerInfo">
        <view class="menu-icon">👥</view>
        <view class="menu-content">
          <text class="menu-title">商户信息</text>
          <text class="menu-desc">名称、门脸、之前清洗情况、清洗元因、联系人等</text>
        </view>
        <text class="menu-arrow">></text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  methods: {
    goToBasicInfo() {
      uni.navigateTo({
        url: '/pages/business/info'
      })
    },
    goToCustomerInfo() {
      uni.navigateTo({
        url: '/pages/business/customer'
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
}

.section-header {
  text-align: center;
  padding: 30rpx 0;
  
  .section-title {
    font-size: 44rpx;
    font-weight: bold;
    color: #333;
  }
}

.menu-list {
  padding: 20rpx;
}

.menu-item {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08);
  
  &:active {
    background-color: #f8f8f8;
  }
}

.menu-icon {
  font-size: 48rpx;
  margin-right: 20rpx;
}

.menu-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.menu-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.menu-desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

.menu-arrow {
  font-size: 32rpx;
  color: #ccc;
  margin-left: 20rpx;
}
</style>