"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      formData: {
        location: "",
        name: "",
        appearance: "",
        parkingEntrance: "",
        price: "",
        parkingReaction: "",
        reputation: ""
      },
      parkingReactions: ["良好", "一般", "较差", "无停车位"],
      parkingReactionIndex: 0
    };
  },
  methods: {
    onParkingReactionChange(e) {
      this.parkingReactionIndex = e.detail.value;
      this.formData.parkingReaction = this.parkingReactions[e.detail.value];
    },
    saveData() {
      if (!this.formData.name.trim()) {
        common_vendor.index.showToast({
          title: "请填写名称",
          icon: "none"
        });
        return;
      }
      if (!this.formData.location.trim()) {
        common_vendor.index.showToast({
          title: "请填写位置",
          icon: "none"
        });
        return;
      }
      common_vendor.index.setStorageSync("businessBasicInfo", this.formData);
      common_vendor.index.showToast({
        title: "保存成功",
        icon: "success"
      });
      setTimeout(() => {
        this.goBack();
      }, 1500);
    },
    goBack() {
      common_vendor.index.navigateBack();
    }
  },
  onLoad() {
    const savedData = common_vendor.index.getStorageSync("businessBasicInfo");
    if (savedData) {
      this.formData = savedData;
      const index = this.parkingReactions.indexOf(savedData.parkingReaction);
      if (index !== -1) {
        this.parkingReactionIndex = index;
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: $data.formData.location,
    b: common_vendor.o(($event) => $data.formData.location = $event.detail.value),
    c: $data.formData.name,
    d: common_vendor.o(($event) => $data.formData.name = $event.detail.value),
    e: $data.formData.appearance,
    f: common_vendor.o(($event) => $data.formData.appearance = $event.detail.value),
    g: $data.formData.parkingEntrance,
    h: common_vendor.o(($event) => $data.formData.parkingEntrance = $event.detail.value),
    i: $data.formData.price,
    j: common_vendor.o(($event) => $data.formData.price = $event.detail.value),
    k: common_vendor.t($data.parkingReactions[$data.parkingReactionIndex]),
    l: common_vendor.o((...args) => $options.onParkingReactionChange && $options.onParkingReactionChange(...args)),
    m: $data.parkingReactionIndex,
    n: $data.parkingReactions,
    o: $data.formData.reputation,
    p: common_vendor.o(($event) => $data.formData.reputation = $event.detail.value),
    q: common_vendor.o((...args) => $options.saveData && $options.saveData(...args)),
    r: common_vendor.o((...args) => $options.goBack && $options.goBack(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/business/info.js.map
