"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      userInfo: {
        name: "",
        company: "",
        isLoggedIn: false
      }
    };
  },
  methods: {
    // Demo user data - replace with real API call later
    getDemoUserData(openid) {
      const demoUsers = {
        "demo_user_1": {
          name: "张三",
          company: "北京建筑公司"
        },
        "demo_user_2": {
          name: "李四",
          company: "上海工程集团"
        },
        "demo_user_3": {
          name: "王五",
          company: "广州施工有限公司"
        }
      };
      return demoUsers[openid] || {
        name: "测试用户",
        company: "演示公司"
      };
    },
    // WeChat login
    wechatLogin() {
      common_vendor.index.login({
        provider: "weixin",
        success: async (loginRes) => {
          common_vendor.index.__f__("log", "at pages/index/index.vue:82", "微信登录成功", loginRes.code);
          const result = await common_vendor.tr.callFunction({
            name: "wechat-login",
            data: {
              code: loginRes.code
            }
          });
          common_vendor.index.__f__("log", "at pages/index/index.vue:92", "OpenID:", result.result.openid);
          const userResult = await common_vendor.tr.callFunction({
            name: "get-user",
            data: {
              openid: result.result.openid
            }
          });
          const userData = userResult.result;
          common_vendor.index.__f__("log", "at pages/index/index.vue:104", "User data from database:", userData);
          this.userInfo.name = userData.name;
          this.userInfo.company = userData.company;
          this.userInfo.isLoggedIn = true;
          common_vendor.index.showToast({
            title: `欢迎 ${userData.name}`,
            icon: "success"
          });
        },
        fail: (err) => {
          common_vendor.index.__f__("log", "at pages/index/index.vue:116", "微信登录失败", err);
          common_vendor.index.showToast({
            title: "登录失败，使用演示模式",
            icon: "none"
          });
          const userData = this.getDemoUserData("demo_user_1");
          this.userInfo.name = userData.name;
          this.userInfo.company = userData.company;
          this.userInfo.isLoggedIn = true;
        }
      });
    },
    goToSite() {
      common_vendor.index.navigateTo({
        url: "/pages/site/index",
        success: () => {
          common_vendor.index.setStorageSync("userInfo", this.userInfo);
        }
      });
    },
    goToConstruction() {
      common_vendor.index.navigateTo({
        url: "/pages/construction/index",
        success: () => {
          common_vendor.index.setStorageSync("userInfo", this.userInfo);
        }
      });
    },
    goToBusiness() {
      common_vendor.index.navigateTo({
        url: "/pages/business/index",
        success: () => {
          common_vendor.index.setStorageSync("userInfo", this.userInfo);
        }
      });
    },
    goToTest() {
      common_vendor.index.navigateTo({
        url: "/pages/test/test"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: !$data.userInfo.isLoggedIn
  }, !$data.userInfo.isLoggedIn ? {
    b: common_vendor.o((...args) => $options.wechatLogin && $options.wechatLogin(...args))
  } : {}, {
    c: $data.userInfo.isLoggedIn
  }, $data.userInfo.isLoggedIn ? {
    d: common_vendor.o((...args) => $options.goToSite && $options.goToSite(...args)),
    e: common_vendor.o((...args) => $options.goToConstruction && $options.goToConstruction(...args)),
    f: common_vendor.o((...args) => $options.goToBusiness && $options.goToBusiness(...args))
  } : {});
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
