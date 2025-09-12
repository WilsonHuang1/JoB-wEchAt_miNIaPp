"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {};
  },
  methods: {
    goToSurvey() {
      common_vendor.index.navigateTo({
        url: "/pages/site/index"
      });
    },
    goToConstruction() {
      common_vendor.index.navigateTo({
        url: "/pages/construction/index"
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
  return {
    a: common_vendor.o((...args) => $options.goToSurvey && $options.goToSurvey(...args)),
    b: common_vendor.o((...args) => $options.goToConstruction && $options.goToConstruction(...args)),
    c: common_vendor.o((...args) => $options.goToTest && $options.goToTest(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/index/index.js.map
