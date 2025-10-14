"use strict";
const common_vendor = require("../../common/vendor.js");
const db = common_vendor.tr.database();
const _sfc_main = {
  data() {
    return {
      summaryData: {
        基本信息: {},
        清洗范围统计: {},
        详细条目: [],
        总计: {}
      },
      formData: {},
      specDetails: {},
      multipleEntries: {},
      currentLocation: null,
      userInfo: {}
    };
  },
  onLoad() {
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on("previewData", (data) => {
      this.summaryData = data.summaryData;
      this.formData = data.formData;
      this.specDetails = data.specDetails;
      this.multipleEntries = data.multipleEntries;
      this.currentLocation = data.currentLocation;
      this.userInfo = data.userInfo;
    });
  },
  methods: {
    goBack() {
      common_vendor.index.navigateBack();
    },
    async confirmSave() {
      try {
        common_vendor.index.showLoading({
          title: "保存中..."
        });
        const record = {
          guishu: this.formData.guishu,
          tankanyuan: this.formData.tankanyuan,
          didian: this.formData.didian,
          mingcheng: this.formData.mingcheng,
          qingxifanwei: this.formData.qingxifanwei,
          environmentData: this.environmentData,
          specDetails: this.specDetails,
          multipleEntries: this.multipleEntries,
          summaryData: this.summaryData,
          location: this.currentLocation,
          userId: this.userInfo.userId,
          status: "draft"
        };
        const result = await db.collection("tankan_records").add(record);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "保存成功",
          icon: "success"
        });
        setTimeout(() => {
          common_vendor.index.navigateBack({
            delta: 2
          });
        }, 1500);
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/site/preview.vue:147", "保存失败:", error);
        common_vendor.index.showToast({
          title: "保存失败: " + error.message,
          icon: "error"
        });
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.summaryData.基本信息
  }, $data.summaryData.基本信息 ? {
    b: common_vendor.f($data.summaryData.基本信息, (value, key, i0) => {
      return {
        a: common_vendor.t(key),
        b: common_vendor.t(value),
        c: key
      };
    }),
    c: common_vendor.f($data.summaryData.清洗范围统计, (value, key, i0) => {
      return {
        a: common_vendor.t(key),
        b: common_vendor.t(value),
        c: key
      };
    }),
    d: common_vendor.f($data.summaryData.总计, (value, key, i0) => {
      return {
        a: common_vendor.t(key),
        b: common_vendor.t(value),
        c: key
      };
    }),
    e: common_vendor.t($data.summaryData.详细条目 ? $data.summaryData.详细条目.length : 0),
    f: common_vendor.f($data.summaryData.详细条目, (item, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.类型),
        b: item.材质
      }, item.材质 ? {
        c: common_vendor.t(item.材质)
      } : {}, {
        d: item.位置 && item.位置 !== "-"
      }, item.位置 && item.位置 !== "-" ? {
        e: common_vendor.t(item.位置)
      } : {}, {
        f: item.规格 && item.规格 !== "-"
      }, item.规格 && item.规格 !== "-" ? {
        g: common_vendor.t(item.规格)
      } : {}, {
        h: common_vendor.t(item.数量),
        i: common_vendor.t(item.频次),
        j: common_vendor.t(item.照片),
        k: index
      });
    })
  } : {}, {
    g: common_vendor.o((...args) => $options.goBack && $options.goBack(...args)),
    h: common_vendor.o((...args) => $options.confirmSave && $options.confirmSave(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/site/preview.js.map
