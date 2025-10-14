"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  methods: {
    goToBasicInfo() {
      common_vendor.index.navigateTo({
        url: "/pages/business/info"
      });
    },
    goToCustomerInfo() {
      common_vendor.index.navigateTo({
        url: "/pages/business/customer"
      });
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.o((...args) => $options.goToBasicInfo && $options.goToBasicInfo(...args)),
    b: common_vendor.o((...args) => $options.goToCustomerInfo && $options.goToCustomerInfo(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/business/index.js.map
