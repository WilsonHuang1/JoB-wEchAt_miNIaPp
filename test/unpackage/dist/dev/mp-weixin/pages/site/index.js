"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      showCleaningOptions: false,
      userInfo: {
        name: "",
        company: "",
        isLoggedIn: false
      },
      formData: {
        guishu: "",
        didian: "",
        tankanyuan: "",
        mingcheng: "",
        qingxifanwei: [],
        qingxichangdu: ""
      },
      specDetails: {}
    };
  },
  onLoad() {
    this.wechatLogin();
  },
  methods: {
    // Demo user data - replace with real API call later
    getDemoUserData(openid) {
      const demoUsers = {
        "demo_user_1": { name: "张三", company: "北京建筑公司" },
        "demo_user_2": { name: "李四", company: "上海工程集团" },
        "demo_user_3": { name: "王五", company: "广州施工有限公司" }
      };
      return demoUsers[openid] || { name: "测试用户", company: "演示公司" };
    },
    // WeChat login
    wechatLogin() {
      common_vendor.index.login({
        provider: "weixin",
        success: (loginRes) => {
          common_vendor.index.__f__("log", "at pages/site/index.vue:199", "微信登录成功", loginRes.code);
          const demoOpenId = "demo_user_" + Math.floor(Math.random() * 3 + 1);
          const userData = this.getDemoUserData(demoOpenId);
          this.userInfo.name = userData.name;
          this.userInfo.company = userData.company;
          this.userInfo.isLoggedIn = true;
          this.formData.guishu = userData.company;
          this.formData.tankanyuan = userData.name;
          common_vendor.index.showToast({
            title: `欢迎 ${userData.name}`,
            icon: "success"
          });
        },
        fail: (err) => {
          common_vendor.index.__f__("log", "at pages/site/index.vue:219", "微信登录失败", err);
          common_vendor.index.showToast({
            title: "登录失败，使用演示数据",
            icon: "none"
          });
          this.setDemoData();
        }
      });
    },
    // Set demo data directly
    setDemoData() {
      this.userInfo.name = "演示用户";
      this.userInfo.company = "演示建筑公司";
      this.userInfo.isLoggedIn = true;
      this.formData.guishu = "演示建筑公司";
      this.formData.tankanyuan = "演示用户";
    },
    getLocation() {
      common_vendor.index.getLocation({
        type: "wgs84",
        success: (res) => {
          this.formData.didian = `纬度:${res.latitude}, 经度:${res.longitude}`;
          common_vendor.index.showToast({ title: "位置获取成功", icon: "success" });
        },
        fail: () => {
          common_vendor.index.showToast({ title: "获取位置失败", icon: "none" });
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
          position: "",
          material: "",
          otherMaterial: "",
          model: "",
          unit: "",
          quantity: "",
          frequency: "",
          photoBefore: [],
          photoAfter: []
        });
      }
      return this.specDetails[option];
    },
    // Check if field is needed for this option
    needsField(option, field) {
      const fieldRules = {
        "position": ["风机", "其他"],
        // 风机 and 其他 need 具体位置
        "model": ["横管", "竖管", "风机", "其他"]
        // 净化器 doesn't need 型号规格, others do
      };
      return fieldRules[field] ? fieldRules[field].includes(option) : true;
    },
    // Handle material selection
    selectMaterial(option, material) {
      const specs = this.getSpecs(option);
      specs.material = material;
      if (material !== "其他") {
        specs.otherMaterial = "";
      }
    },
    // Check if field is required (marked with *)
    isRequired(option, field) {
      if (option === "其他" && (field === "position" || field === "model")) {
        return false;
      }
      return this.needsField(option, field);
    },
    // Handle photo taking
    takePhoto(option, type) {
      common_vendor.index.chooseImage({
        count: 1,
        success: (res) => {
          const specs = this.getSpecs(option);
          if (type === "before") {
            specs.photoBefore.push(res.tempFilePaths[0]);
          } else {
            specs.photoAfter.push(res.tempFilePaths[0]);
          }
          common_vendor.index.showToast({ title: "照片添加成功", icon: "success" });
        },
        fail: () => {
          common_vendor.index.showToast({ title: "拍照失败", icon: "none" });
        }
      });
    },
    save() {
      common_vendor.index.__f__("log", "at pages/site/index.vue:330", "保存踏勘数据:", this.formData);
      common_vendor.index.showToast({ title: "保存成功", icon: "success" });
    },
    goBack() {
      common_vendor.index.navigateBack();
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.userInfo.isLoggedIn
  }, $data.userInfo.isLoggedIn ? {
    b: common_vendor.t($data.userInfo.name),
    c: common_vendor.t($data.userInfo.company)
  } : {}, {
    d: $data.formData.guishu,
    e: common_vendor.o(($event) => $data.formData.guishu = $event.detail.value),
    f: $data.formData.tankanyuan,
    g: common_vendor.o(($event) => $data.formData.tankanyuan = $event.detail.value),
    h: $data.formData.didian,
    i: common_vendor.o(($event) => $data.formData.didian = $event.detail.value),
    j: common_vendor.o((...args) => $options.getLocation && $options.getLocation(...args)),
    k: $data.formData.mingcheng,
    l: common_vendor.o(($event) => $data.formData.mingcheng = $event.detail.value),
    m: common_vendor.t($data.showCleaningOptions ? "▼" : "▶"),
    n: common_vendor.o((...args) => $options.toggleCleaningOptions && $options.toggleCleaningOptions(...args)),
    o: $data.showCleaningOptions
  }, $data.showCleaningOptions ? {
    p: $data.formData.qingxifanwei.includes("横管"),
    q: common_vendor.o(($event) => $options.toggleOption("横管")),
    r: $data.formData.qingxifanwei.includes("竖管"),
    s: common_vendor.o(($event) => $options.toggleOption("竖管")),
    t: $data.formData.qingxifanwei.includes("风机"),
    v: common_vendor.o(($event) => $options.toggleOption("风机")),
    w: $data.formData.qingxifanwei.includes("净化器"),
    x: common_vendor.o(($event) => $options.toggleOption("净化器")),
    y: $data.formData.qingxifanwei.includes("其他"),
    z: common_vendor.o(($event) => $options.toggleOption("其他"))
  } : {}, {
    A: $data.formData.qingxifanwei.length > 0
  }, $data.formData.qingxifanwei.length > 0 ? {
    B: common_vendor.f($data.formData.qingxifanwei, (option, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(option),
        b: $options.needsField(option, "position")
      }, $options.needsField(option, "position") ? {
        c: common_vendor.t($options.isRequired(option, "position") ? "*" : ""),
        d: $options.getSpecs(option).position,
        e: common_vendor.o(($event) => $options.getSpecs(option).position = $event.detail.value, index)
      } : {}, {
        f: option === "横管" || option === "竖管"
      }, option === "横管" || option === "竖管" ? common_vendor.e({
        g: $options.getSpecs(option).material === "镀锌铁管",
        h: common_vendor.o(($event) => $options.selectMaterial(option, "镀锌铁管"), index),
        i: $options.getSpecs(option).material === "不锈钢",
        j: common_vendor.o(($event) => $options.selectMaterial(option, "不锈钢"), index),
        k: $options.getSpecs(option).material === "其他",
        l: common_vendor.o(($event) => $options.selectMaterial(option, "其他"), index),
        m: $options.getSpecs(option).material === "其他"
      }, $options.getSpecs(option).material === "其他" ? {
        n: $options.getSpecs(option).otherMaterial,
        o: common_vendor.o(($event) => $options.getSpecs(option).otherMaterial = $event.detail.value, index)
      } : {}) : {}, {
        p: $options.needsField(option, "model")
      }, $options.needsField(option, "model") ? {
        q: common_vendor.t($options.isRequired(option, "model") ? "*" : ""),
        r: $options.getSpecs(option).model,
        s: common_vendor.o(($event) => $options.getSpecs(option).model = $event.detail.value, index)
      } : {}, {
        t: $options.getSpecs(option).unit,
        v: common_vendor.o(($event) => $options.getSpecs(option).unit = $event.detail.value, index),
        w: $options.getSpecs(option).quantity,
        x: common_vendor.o(($event) => $options.getSpecs(option).quantity = $event.detail.value, index),
        y: $options.getSpecs(option).frequency,
        z: common_vendor.o(($event) => $options.getSpecs(option).frequency = $event.detail.value, index),
        A: common_vendor.o(($event) => $options.takePhoto(option, "before"), index),
        B: $options.getSpecs(option).photoBefore.length > 0
      }, $options.getSpecs(option).photoBefore.length > 0 ? {
        C: common_vendor.t($options.getSpecs(option).photoBefore.length)
      } : {}, {
        D: index
      });
    })
  } : {}, {
    C: common_vendor.o((...args) => $options.save && $options.save(...args)),
    D: common_vendor.o((...args) => $options.goBack && $options.goBack(...args))
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/site/index.js.map
