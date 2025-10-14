"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      result: "Choose a function to test"
    };
  },
  methods: {
    async testUserAuth() {
      try {
        const res = await common_vendor.tr.callFunction({
          name: "userAuth",
          data: {
            action: "register",
            userInfo: {
              openId: "test-openid-123",
              nickName: "Test User",
              avatarUrl: "https://example.com/avatar.jpg"
            }
          }
        });
        this.result = JSON.stringify(res.result, null, 2);
      } catch (error) {
        this.result = `Error: ${error.message}`;
      }
    },
    async testCreateJob() {
      try {
        const res = await common_vendor.tr.callFunction({
          name: "jobManager",
          data: {
            action: "createJob",
            jobData: {
              title: "Frontend Developer",
              company: "Tech Corp",
              city: "Beijing",
              salary: "15K-25K",
              jobType: "fulltime",
              description: "Looking for experienced frontend developer..."
            }
          }
        });
        this.result = JSON.stringify(res.result, null, 2);
      } catch (error) {
        this.result = `Error: ${error.message}`;
      }
    },
    async testGetJobs() {
      try {
        const res = await common_vendor.tr.callFunction({
          name: "jobManager",
          data: {
            action: "getJobs",
            filters: {}
          }
        });
        this.result = JSON.stringify(res.result, null, 2);
      } catch (error) {
        this.result = `Error: ${error.message}`;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.o((...args) => $options.testUserAuth && $options.testUserAuth(...args)),
    b: common_vendor.o((...args) => $options.testCreateJob && $options.testCreateJob(...args)),
    c: common_vendor.o((...args) => $options.testGetJobs && $options.testGetJobs(...args)),
    d: common_vendor.t($data.result)
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/test/test.js.map
