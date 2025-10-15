"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      currentStep: "preparation",
      // preparation, environment, inspection, completion
      documentGenerating: false,
      documentGenerated: false,
      isDropdownOpen: false,
      sidebarVisible: true,
      // Missing properties for step 3
      qingxifanwei: [],
      cleaningOptions: [
        {
          value: "hengguanshuguanxitong",
          label: "横管竖管系统"
        },
        {
          value: "fengji",
          label: "风机"
        },
        {
          value: "jinghuaqi",
          label: "净化器"
        },
        {
          value: "chufangyanzao",
          label: "厨房烟罩"
        },
        {
          value: "qita",
          label: "其他"
        }
      ],
      specDetails: {},
      pipeEntries: [{
        diameter: "",
        length: "",
        note: ""
      }],
      availableScopes: ["横管", "竖管", "风机", "净化器", "厨房烟罩", "其他"],
      addedItems: [],
      // Array to store all added cleaning items
      userInfo: {
        name: "",
        company: "",
        isLoggedIn: false
      },
      formData: {
        guishu: "",
        didian: "",
        tankanyuan: "",
        address: "",
        latitude: "",
        longitude: "",
        mingcheng: ""
      },
      environmentData: {
        parkingEntrance: "",
        recommendedParking: "",
        elevatorEntrance: "",
        recommendedRoute: "",
        rooftopEnvironment: "",
        waterElectricity: "",
        otherConditions: ""
      }
    };
  },
  computed: {
    progressWidth() {
      const steps = ["preparation", "environment", "inspection", "completion"];
      const currentIndex = steps.indexOf(this.currentStep);
      return `${currentIndex / (steps.length - 1) * 100}%`;
    },
    selectedCleaningOptions() {
      return this.qingxifanwei;
    }
  },
  onLoad() {
    this.userInfo = common_vendor.index.getStorageSync("userInfo") || {};
    if (!this.userInfo.isLoggedIn) {
      common_vendor.index.navigateBack();
      return;
    }
    this.formData.guishu = this.userInfo.company;
    this.formData.tankanyuan = this.userInfo.name;
  },
  methods: {
    // Step navigation and completion
    goToStep(targetStep) {
      this.currentStep = targetStep;
    },
    isStepCompleted(step) {
      switch (step) {
        case "preparation":
          return this.formData.guishu && this.formData.tankanyuan && this.formData.address && this.formData.mingcheng;
        case "environment":
          return this.environmentData.parkingEntrance || this.environmentData.recommendedParking || this.environmentData.elevatorEntrance || this.environmentData.recommendedRoute || this.environmentData.rooftopEnvironment || this.environmentData.waterElectricity || this.environmentData.otherConditions;
        case "inspection":
          if (this.addedItems.length === 0)
            return false;
          return this.addedItems.some((item) => {
            const specs = item.specs;
            let isComplete = specs.model && specs.unit && specs.quantity && specs.frequency;
            if (item.type === "厨房烟罩") {
              isComplete = isComplete && specs.length;
            }
            if (this.needsField(item.type, "position")) {
              isComplete = isComplete && specs.position;
            }
            return isComplete && specs.photoBefore.length > 0;
          });
        case "completion":
          return this.isStepCompleted("preparation") && this.isStepCompleted("environment") && this.isStepCompleted("inspection");
        default:
          return false;
      }
    },
    // Step navigation methods
    proceedToEnvironment() {
      if (!this.formData.guishu || !this.formData.tankanyuan || !this.formData.address || !this.formData.mingcheng) {
        common_vendor.index.showToast({
          title: "请完善基础信息",
          icon: "none"
        });
        return;
      }
      this.currentStep = "environment";
    },
    goBackToPreparation() {
      this.currentStep = "preparation";
    },
    proceedToInspection() {
      this.currentStep = "inspection";
    },
    goBackToEnvironment() {
      this.currentStep = "environment";
    },
    proceedToCompletion() {
      if (this.addedItems.length === 0) {
        common_vendor.index.showToast({
          title: "请选择至少一个清洗范围",
          icon: "none"
        });
        return;
      }
      this.currentStep = "completion";
    },
    goBackToInspection() {
      this.currentStep = "inspection";
    },
    // New methods for step 3 functionality
    toggleCleaningOption(value) {
      const index = this.qingxifanwei.indexOf(value);
      if (index > -1) {
        this.qingxifanwei.splice(index, 1);
        delete this.specDetails[value];
      } else {
        this.qingxifanwei.push(value);
        this.$set(this.specDetails, value, {
          quantity: "",
          specification: "",
          unit: ""
        });
      }
      this.$forceUpdate();
    },
    getOptionLabel(option) {
      const found = this.cleaningOptions.find((opt) => opt.value === option);
      return found ? found.label : option;
    },
    getSummaryText(option) {
      if (option === "hengguanshuguanxitong") {
        return `${this.pipeEntries.length}条管道`;
      }
      const specs = this.specDetails[option];
      if (!specs)
        return "";
      return `${specs.quantity || 0} ${specs.unit || ""}`;
    },
    addPipeEntry() {
      this.pipeEntries.push({
        diameter: "",
        length: "",
        note: ""
      });
    },
    removePipeEntry(index) {
      if (this.pipeEntries.length > 1) {
        this.pipeEntries.splice(index, 1);
      }
    },
    submitInspection() {
      this.save();
    },
    getCleaningSummary() {
      if (this.addedItems.length === 0)
        return "无";
      const summary = {};
      this.addedItems.forEach((item) => {
        if (summary[item.type]) {
          summary[item.type]++;
        } else {
          summary[item.type] = 1;
        }
      });
      return Object.entries(summary).map(
        ([type, count]) => count > 1 ? `${type}(${count}个)` : type
      ).join(", ");
    },
    // Location method
    getLocation() {
      common_vendor.index.chooseLocation({
        success: (res) => {
          common_vendor.index.__f__("log", "at pages/site/index.vue:536", "选择的位置:", res);
          this.formData.latitude = res.latitude;
          this.formData.longitude = res.longitude;
          this.formData.address = res.address + " " + res.name;
          common_vendor.index.showToast({
            title: "位置选择成功",
            icon: "success"
          });
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/site/index.vue:547", "位置选择失败:", err);
        }
      });
    },
    removeItem(index) {
      this.addedItems.splice(index, 1);
      if (this.addedItems.length === 0) {
        this.showAddDropdown = true;
      }
    },
    createDefaultSpecs(type) {
      let defaultUnit = "";
      if (["横管", "竖管"].includes(type))
        defaultUnit = "米(m)";
      else if (["风机", "净化器"].includes(type))
        defaultUnit = "台";
      else if (type === "厨房烟罩")
        defaultUnit = "个";
      return {
        position: "",
        model: "",
        unit: defaultUnit,
        quantity: "",
        frequency: "",
        length: "",
        photoBefore: []
      };
    },
    isUnitLocked(option) {
      return ["横管", "竖管", "风机", "净化器", "厨房烟罩"].includes(option);
    },
    toggleDropdown() {
      common_vendor.index.__f__("log", "at pages/site/index.vue:581", "Dropdown clicked, current state:", this.isDropdownOpen);
      this.isDropdownOpen = !this.isDropdownOpen;
    },
    selectScope(scope) {
      common_vendor.index.__f__("log", "at pages/site/index.vue:586", "Selected scope:", scope);
      this.addNewItem(scope);
      this.isDropdownOpen = false;
    },
    addNewItem(type) {
      this.addedItems.push({
        type,
        specs: this.createDefaultSpecs(type)
      });
    },
    needsField(option, field) {
      const fieldRequirements = {
        "横管": ["model", "unit", "quantity", "frequency", "photoBefore"],
        "竖管": ["model", "unit", "quantity", "frequency", "photoBefore"],
        "风机": ["position", "model", "unit", "quantity", "frequency", "photoBefore"],
        "净化器": ["model", "unit", "quantity", "frequency", "photoBefore"],
        "厨房烟罩": ["model", "unit", "quantity", "frequency", "length", "photoBefore"],
        "其他": ["position", "model", "unit", "quantity", "frequency", "photoBefore"]
      };
      return fieldRequirements[option] && fieldRequirements[option].includes(field);
    },
    takePhoto(itemIndex, type) {
      common_vendor.index.chooseImage({
        count: 9,
        sizeType: ["original", "compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          const specs = this.addedItems[itemIndex].specs;
          if (type === "before") {
            specs.photoBefore.push(...res.tempFilePaths);
          }
          common_vendor.index.showToast({
            title: `已添加${res.tempFilePaths.length}张照片`,
            icon: "success"
          });
        },
        fail: (err) => {
          common_vendor.index.__f__("log", "at pages/site/index.vue:627", "拍照失败", err);
          common_vendor.index.showToast({
            title: "拍照失败",
            icon: "none"
          });
        }
      });
    },
    deletePhoto(itemIndex, type, photoIndex) {
      const specs = this.addedItems[itemIndex].specs;
      if (type === "before") {
        specs.photoBefore.splice(photoIndex, 1);
      }
      common_vendor.index.showToast({
        title: "照片已删除",
        icon: "success"
      });
    },
    // // Document generation methods
    // generateDocument() {
    //     this.documentGenerating = true;
    //     setTimeout(() => {
    //         this.documentGenerating = false;
    //         this.documentGenerated = true;
    //         uni.showToast({
    //             title: '踏勘报告生成完成',
    //             icon: 'success'
    //         });
    //     }, 3000);
    // },
    previewDocument() {
      common_vendor.index.showToast({
        title: "打开报告预览",
        icon: "success"
      });
    },
    async uploadPhotos() {
      const uploadedPhotos = [];
      for (let item of this.addedItems) {
        const uploadedBeforePhotos = [];
        for (let photoPath of item.specs.photoBefore) {
          try {
            const result = await common_vendor.tr.uploadFile({
              filePath: photoPath,
              cloudPath: `tankan/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
            });
            uploadedBeforePhotos.push(result.fileID);
          } catch (error) {
            common_vendor.index.__f__("error", "at pages/site/index.vue:682", "照片上传失败:", error);
          }
        }
        uploadedPhotos.push({
          type: item.type,
          specs: {
            ...item.specs,
            photoBefore: uploadedBeforePhotos
          }
        });
      }
      return uploadedPhotos;
    },
    // Save method
    async save() {
      try {
        common_vendor.index.showLoading({
          title: "上传照片中..."
        });
        const uploadedItems = await this.uploadPhotos();
        common_vendor.index.showLoading({
          title: "保存数据中..."
        });
        const db = common_vendor.tr.database();
        if (!this.formData.latitude) {
          common_vendor.index.hideLoading();
          common_vendor.index.showToast({
            title: "请先选择位置",
            icon: "none"
          });
          return;
        }
        const completeData = {
          guishu: this.formData.guishu,
          tankanyuan: this.formData.tankanyuan,
          didian: this.formData.address,
          mingcheng: this.formData.mingcheng,
          environmentData: this.environmentData,
          qingxifanwei: uploadedItems,
          // Everything in one place now
          multipleEntries: {},
          location: {
            latitude: this.formData.latitude,
            longitude: this.formData.longitude,
            address: this.formData.address
          },
          userId: common_vendor.index.getStorageSync("userId") || "temp_user",
          status: "submitted"
        };
        const result = await db.collection("tankan_records").add(completeData);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "踏勘数据上传成功",
          icon: "success"
        });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/site/index.vue:754", "保存失败:", error);
        common_vendor.index.showToast({
          title: "保存失败: " + error.message,
          icon: "none"
        });
      }
    },
    goBack() {
      common_vendor.index.navigateBack();
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.currentStep === "preparation" ? 1 : "",
    b: $options.isStepCompleted("preparation") ? 1 : "",
    c: common_vendor.o(($event) => $options.goToStep("preparation")),
    d: $data.currentStep === "environment" ? 1 : "",
    e: $options.isStepCompleted("environment") ? 1 : "",
    f: common_vendor.o(($event) => $options.goToStep("environment")),
    g: $data.currentStep === "inspection" ? 1 : "",
    h: $options.isStepCompleted("inspection") ? 1 : "",
    i: common_vendor.o(($event) => $options.goToStep("inspection")),
    j: $data.currentStep === "completion" ? 1 : "",
    k: $options.isStepCompleted("completion") ? 1 : "",
    l: common_vendor.o(($event) => $options.goToStep("completion")),
    m: !$data.sidebarVisible ? 1 : "",
    n: !$data.sidebarVisible
  }, !$data.sidebarVisible ? {
    o: common_vendor.o(($event) => $options.goToStep("preparation")),
    p: $data.currentStep === "preparation" ? 1 : "",
    q: $options.isStepCompleted("preparation") ? 1 : "",
    r: common_vendor.o(($event) => $options.goToStep("environment")),
    s: $data.currentStep === "environment" ? 1 : "",
    t: $options.isStepCompleted("environment") ? 1 : "",
    v: common_vendor.o(($event) => $options.goToStep("inspection")),
    w: $data.currentStep === "inspection" ? 1 : "",
    x: $options.isStepCompleted("inspection") ? 1 : "",
    y: common_vendor.o(($event) => $options.goToStep("completion")),
    z: $data.currentStep === "completion" ? 1 : "",
    A: $options.isStepCompleted("completion") ? 1 : ""
  } : {}, {
    B: common_vendor.t($data.sidebarVisible ? "◀" : "▶"),
    C: common_vendor.o(($event) => $data.sidebarVisible = !$data.sidebarVisible),
    D: common_vendor.t($data.userInfo.name),
    E: common_vendor.t($data.userInfo.company),
    F: $data.currentStep === "preparation"
  }, $data.currentStep === "preparation" ? {
    G: $data.formData.guishu,
    H: common_vendor.o(($event) => $data.formData.guishu = $event.detail.value),
    I: $data.formData.tankanyuan,
    J: common_vendor.o(($event) => $data.formData.tankanyuan = $event.detail.value),
    K: common_vendor.t($data.formData.address || "点击下方按钮获取位置"),
    L: common_vendor.o((...args) => $options.getLocation && $options.getLocation(...args)),
    M: $data.formData.mingcheng,
    N: common_vendor.o(($event) => $data.formData.mingcheng = $event.detail.value),
    O: common_vendor.o((...args) => $options.proceedToEnvironment && $options.proceedToEnvironment(...args))
  } : {}, {
    P: $data.currentStep === "environment"
  }, $data.currentStep === "environment" ? {
    Q: $data.environmentData.parkingEntrance,
    R: common_vendor.o(($event) => $data.environmentData.parkingEntrance = $event.detail.value),
    S: $data.environmentData.recommendedParking,
    T: common_vendor.o(($event) => $data.environmentData.recommendedParking = $event.detail.value),
    U: $data.environmentData.elevatorEntrance,
    V: common_vendor.o(($event) => $data.environmentData.elevatorEntrance = $event.detail.value),
    W: $data.environmentData.recommendedRoute,
    X: common_vendor.o(($event) => $data.environmentData.recommendedRoute = $event.detail.value),
    Y: $data.environmentData.rooftopEnvironment,
    Z: common_vendor.o(($event) => $data.environmentData.rooftopEnvironment = $event.detail.value),
    aa: $data.environmentData.waterElectricity,
    ab: common_vendor.o(($event) => $data.environmentData.waterElectricity = $event.detail.value),
    ac: $data.environmentData.otherConditions,
    ad: common_vendor.o(($event) => $data.environmentData.otherConditions = $event.detail.value),
    ae: common_vendor.o((...args) => $options.goBackToPreparation && $options.goBackToPreparation(...args)),
    af: common_vendor.o((...args) => $options.proceedToInspection && $options.proceedToInspection(...args))
  } : {}, {
    ag: $data.currentStep === "inspection"
  }, $data.currentStep === "inspection" ? common_vendor.e({
    ah: $data.addedItems.length > 0
  }, $data.addedItems.length > 0 ? {
    ai: common_vendor.f($data.addedItems, (item, index, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.type),
        b: common_vendor.t(index + 1),
        c: common_vendor.o(($event) => $options.removeItem(index), index),
        d: $options.needsField(item.type, "position")
      }, $options.needsField(item.type, "position") ? {
        e: item.specs.position,
        f: common_vendor.o(($event) => item.specs.position = $event.detail.value, index)
      } : {}, {
        g: item.specs.model,
        h: common_vendor.o(($event) => item.specs.model = $event.detail.value, index),
        i: $options.isUnitLocked(item.type),
        j: item.specs.unit,
        k: common_vendor.o(($event) => item.specs.unit = $event.detail.value, index),
        l: item.specs.quantity,
        m: common_vendor.o(($event) => item.specs.quantity = $event.detail.value, index),
        n: item.specs.frequency,
        o: common_vendor.o(($event) => item.specs.frequency = $event.detail.value, index),
        p: item.type === "厨房烟罩"
      }, item.type === "厨房烟罩" ? {
        q: item.specs.length,
        r: common_vendor.o(($event) => item.specs.length = $event.detail.value, index)
      } : {}, {
        s: common_vendor.o(($event) => $options.takePhoto(index, "before"), index),
        t: item.specs.photoBefore.length > 0
      }, item.specs.photoBefore.length > 0 ? {
        v: common_vendor.f(item.specs.photoBefore, (photo, photoIndex, i1) => {
          return {
            a: photo,
            b: common_vendor.o(($event) => $options.deletePhoto(index, "before", photoIndex), photoIndex),
            c: photoIndex
          };
        })
      } : {}, {
        w: index
      });
    })
  } : {}, {
    aj: $data.isDropdownOpen ? 1 : "",
    ak: common_vendor.o((...args) => $options.toggleDropdown && $options.toggleDropdown(...args)),
    al: $data.isDropdownOpen
  }, $data.isDropdownOpen ? {
    am: common_vendor.f($data.availableScopes, (scope, index, i0) => {
      return {
        a: common_vendor.t(scope),
        b: index,
        c: common_vendor.o(($event) => $options.selectScope(scope), index)
      };
    })
  } : {}, {
    an: common_vendor.o((...args) => $options.goBackToEnvironment && $options.goBackToEnvironment(...args)),
    ao: common_vendor.o((...args) => $options.proceedToCompletion && $options.proceedToCompletion(...args))
  }) : {}, {
    ap: $data.currentStep === "completion"
  }, $data.currentStep === "completion" ? common_vendor.e({
    aq: common_vendor.t($data.formData.mingcheng),
    ar: common_vendor.t($data.formData.address),
    as: common_vendor.t($data.formData.tankanyuan),
    at: common_vendor.t($data.formData.guishu),
    av: common_vendor.t($options.getCleaningSummary()),
    aw: $data.documentGenerating
  }, $data.documentGenerating ? {} : common_vendor.e({
    ax: common_vendor.o((...args) => _ctx.generateDocument && _ctx.generateDocument(...args)),
    ay: $data.documentGenerated
  }, $data.documentGenerated ? {
    az: common_vendor.o((...args) => $options.previewDocument && $options.previewDocument(...args))
  } : {}), {
    aA: common_vendor.o((...args) => $options.goBackToInspection && $options.goBackToInspection(...args)),
    aB: common_vendor.o((...args) => $options.save && $options.save(...args))
  }) : {}, {
    aC: !$data.sidebarVisible ? 1 : ""
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/site/index.js.map
