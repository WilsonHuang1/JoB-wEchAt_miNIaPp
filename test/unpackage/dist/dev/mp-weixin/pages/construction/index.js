"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  data() {
    return {
      currentStep: "beforeCleaning",
      sidebarVisible: true,
      // Cleaning options
      cleaningOptions: [
        {
          value: "kitchen",
          label: "厨房"
        },
        {
          value: "pipe",
          label: "管道"
        },
        {
          value: "fan",
          label: "风机"
        },
        {
          value: "purifier",
          label: "净化器"
        }
      ],
      // Sub-options for each cleaning area (removed 其他)
      cleaningSubOptions: {
        kitchen: [
          {
            value: "environment",
            label: "环境"
          },
          {
            value: "stove",
            label: "灶台"
          },
          {
            value: "hood",
            label: "烟罩"
          },
          {
            value: "grease_filter",
            label: "油篦子"
          },
          {
            value: "hood_pipe",
            label: "烟罩横管"
          }
        ],
        pipe: [
          {
            value: "pipe_environment",
            label: "管道环境"
          },
          {
            value: "pipe_leak",
            label: "管道漏油"
          },
          {
            value: "damage_points",
            label: "破损点"
          }
        ],
        fan: [
          {
            value: "location_environment",
            label: "环境位置"
          },
          {
            value: "appearance",
            label: "外观"
          },
          {
            value: "fan_impeller",
            label: "风机叶轮"
          },
          {
            value: "exhaust_outlet",
            label: "排风口"
          }
        ],
        purifier: [
          {
            value: "location_environment",
            label: "位置环境"
          },
          {
            value: "appearance",
            label: "外观"
          },
          {
            value: "electric_field",
            label: "电场"
          }
        ]
      },
      // Photos for custom options (其他部位)
      customOptionPhotos: {
        before: {},
        // { custom_123456: [photo1, photo2] }
        after: {}
      },
      // Selected cleaning items - now supports multiple of same type
      selectedCleaningItems: [],
      // Array of objects: [{id: unique_id, value: 'kitchen', label: '厨房'}]
      customBeforeOption: "",
      // Selected sub-options for each item (using unique IDs)
      selectedSubOptions: {},
      // { item_id: ['environment', 'stove'] }
      // Side notes for each item (using unique IDs)
      sideNotes: {},
      // { item_id: 'some notes' }
      // Detailed photos organized by item ID and sub-option
      detailedBeforePhotos: {},
      // { item_id: { environment: [photos], stove: [photos] } }
      detailedAfterPhotos: {},
      workPhotos: [],
      environmentNotes: "",
      userInfo: {
        name: common_vendor.index.getStorageSync("userName") || "未知用户",
        company: common_vendor.index.getStorageSync("userCompany") || "未知公司"
      }
    };
  },
  onLoad() {
    common_vendor.index.removeStorageSync("cleaningData");
    this.loadSavedData();
  },
  methods: {
    // Step navigation with locking
    goToStep(step) {
      if (step === "afterCleaning") {
        if (!this.isStepCompleted("beforeCleaning")) {
          common_vendor.index.showToast({
            title: "请先完成清洗前状态拍照",
            icon: "none",
            duration: 2e3
          });
          return;
        }
      }
      this.currentStep = step;
    },
    // Add cleaning option (allows multiple of same type)
    addCleaningOption(value) {
      const uniqueId = Date.now() + "_" + Math.random();
      const option = this.cleaningOptions.find((opt) => opt.value === value);
      const newItem = {
        id: uniqueId,
        value,
        label: option.label
      };
      this.selectedCleaningItems.push(newItem);
      this.$set(this.selectedSubOptions, uniqueId, []);
      this.$set(this.detailedBeforePhotos, uniqueId, {});
      this.$set(this.detailedAfterPhotos, uniqueId, {});
      this.$set(this.sideNotes, uniqueId, "");
    },
    // Remove cleaning item
    removeCleaningItem(itemId) {
      const index = this.selectedCleaningItems.findIndex((item) => item.id === itemId);
      if (index > -1) {
        this.selectedCleaningItems.splice(index, 1);
        delete this.selectedSubOptions[itemId];
        delete this.detailedBeforePhotos[itemId];
        delete this.detailedAfterPhotos[itemId];
        delete this.sideNotes[itemId];
      }
    },
    // Add custom option
    addCustomBeforeOption() {
      if (this.customBeforeOption.trim()) {
        const customValue = "custom_" + Date.now();
        this.cleaningOptions.push({
          value: customValue,
          label: this.customBeforeOption.trim()
        });
        this.addCleaningOption(customValue);
        this.customBeforeOption = "";
        this.$set(this.customOptionPhotos.before, customValue, []);
        this.$set(this.customOptionPhotos.after, customValue, []);
      }
    },
    // Get sub-options for a specific area
    getSubOptionsForArea(area) {
      return this.cleaningSubOptions[area] || [];
    },
    // Check if sub-option is selected
    isSubOptionSelected(itemId, subOption) {
      return this.selectedSubOptions[itemId] && this.selectedSubOptions[itemId].includes(subOption);
    },
    // Toggle sub-option selection
    toggleSubOption(itemId, subOption) {
      if (!this.selectedSubOptions[itemId]) {
        this.$set(this.selectedSubOptions, itemId, []);
      }
      const index = this.selectedSubOptions[itemId].indexOf(subOption);
      if (index > -1) {
        this.selectedSubOptions[itemId].splice(index, 1);
        if (this.detailedBeforePhotos[itemId]) {
          delete this.detailedBeforePhotos[itemId][subOption];
        }
        if (this.detailedAfterPhotos[itemId]) {
          delete this.detailedAfterPhotos[itemId][subOption];
        }
      } else {
        this.selectedSubOptions[itemId].push(subOption);
        if (!this.detailedBeforePhotos[itemId]) {
          this.$set(this.detailedBeforePhotos, itemId, {});
        }
        if (!this.detailedAfterPhotos[itemId]) {
          this.$set(this.detailedAfterPhotos, itemId, {});
        }
        this.$set(this.detailedBeforePhotos[itemId], subOption, []);
        this.$set(this.detailedAfterPhotos[itemId], subOption, []);
      }
    },
    // Update side notes
    updateSideNotes(itemId, event) {
      this.$set(this.sideNotes, itemId, event.detail.value);
    },
    // Get selected sub-options for an item
    getSelectedSubOptions(itemId) {
      return this.selectedSubOptions[itemId] || [];
    },
    // Get sub-option label
    getSubOptionLabel(area, subOptionValue) {
      const subOptions = this.getSubOptionsForArea(area);
      const found = subOptions.find((opt) => opt.value === subOptionValue);
      return found ? found.label : subOptionValue;
    },
    // Upload detailed photos
    uploadDetailedPhotos(type, itemId, subOption) {
      common_vendor.index.__f__("log", "at pages/construction/index.vue:518", `Upload ${type} photos for ${itemId} - ${subOption}`);
      common_vendor.index.chooseImage({
        count: 9,
        success: (res) => {
          const photosObj = type === "before" ? this.detailedBeforePhotos : this.detailedAfterPhotos;
          if (!photosObj[itemId]) {
            this.$set(photosObj, itemId, {});
          }
          if (!photosObj[itemId][subOption]) {
            this.$set(photosObj[itemId], subOption, []);
          }
          photosObj[itemId][subOption].push(...res.tempFilePaths);
          common_vendor.index.showToast({
            title: `已选择 ${res.tempFilePaths.length} 张照片`,
            icon: "success"
          });
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/construction/index.vue:540", "选择图片失败:", err);
          common_vendor.index.showToast({
            title: "选择图片失败",
            icon: "error"
          });
        }
      });
    },
    // Get detailed photo count
    getDetailedPhotoCount(type, itemId, subOption) {
      const photosObj = type === "before" ? this.detailedBeforePhotos : this.detailedAfterPhotos;
      return photosObj[itemId] && photosObj[itemId][subOption] ? photosObj[itemId][subOption].length : 0;
    },
    // Upload photos for custom options (其他部位)
    uploadCustomOptionPhotos(type, option) {
      common_vendor.index.__f__("log", "at pages/construction/index.vue:557", `Upload ${type} photos for custom option ${option}`);
      common_vendor.index.chooseImage({
        count: 9,
        success: (res) => {
          if (!this.customOptionPhotos[type]) {
            this.$set(this.customOptionPhotos, type, {});
          }
          if (!this.customOptionPhotos[type][option]) {
            this.$set(this.customOptionPhotos[type], option, []);
          }
          this.customOptionPhotos[type][option].push(...res.tempFilePaths);
          common_vendor.index.showToast({
            title: `已选择 ${res.tempFilePaths.length} 张照片`,
            icon: "success"
          });
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/construction/index.vue:576", "选择图片失败:", err);
          common_vendor.index.showToast({
            title: "选择图片失败",
            icon: "error"
          });
        }
      });
    },
    // Get photo count for custom options
    getCustomPhotoCount(type, option) {
      return this.customOptionPhotos[type] && this.customOptionPhotos[type][option] ? this.customOptionPhotos[type][option].length : 0;
    },
    // Upload work photos
    uploadWorkPhotos() {
      common_vendor.index.__f__("log", "at pages/construction/index.vue:593", "Upload work photos");
      common_vendor.index.chooseImage({
        count: 9,
        success: (res) => {
          this.workPhotos.push(...res.tempFilePaths);
          common_vendor.index.showToast({
            title: `已选择 ${res.tempFilePaths.length} 张照片`,
            icon: "success"
          });
        },
        fail: (err) => {
          common_vendor.index.__f__("error", "at pages/construction/index.vue:605", "选择图片失败:", err);
          common_vendor.index.showToast({
            title: "选择图片失败",
            icon: "error"
          });
        }
      });
    },
    // Check if after cleaning is complete
    isAfterCleaningComplete() {
      return this.selectedCleaningItems.every((item) => {
        if (item.value.startsWith("custom_")) {
          return this.getCustomPhotoCount("after", item.value) > 0;
        }
        const selectedSubs = this.getSelectedSubOptions(item.id);
        return selectedSubs.every((subOption) => {
          return this.getDetailedPhotoCount("after", item.id, subOption) > 0;
        });
      });
    },
    // Check if step is completed
    isStepCompleted(step) {
      switch (step) {
        case "beforeCleaning":
          return this.selectedCleaningItems.length > 0 && this.selectedCleaningItems.every((item) => {
            if (item.value.startsWith("custom_")) {
              return this.getCustomPhotoCount("before", item.value) > 0;
            }
            const selectedSubs = this.getSelectedSubOptions(item.id);
            return selectedSubs.length > 0 && selectedSubs.every((subOption) => {
              return this.getDetailedPhotoCount("before", item.id, subOption) > 0;
            });
          });
        case "afterCleaning":
          return this.isAfterCleaningComplete();
        case "workPhotos":
          return this.workPhotos.length > 0;
        case "environmentNotes":
          return this.environmentNotes.trim().length > 0;
        default:
          return false;
      }
    },
    async saveCleaningRecord() {
      try {
        common_vendor.index.showLoading({
          title: "保存中..."
        });
        const db = common_vendor.tr.database();
        const record = {
          projectName: this.projectName || "未命名项目",
          // Add input for this
          projectLocation: this.projectLocation || "",
          // Add input for this
          cleaningDate: Date.now(),
          cleaningAreas: this.beforeCleaningSelected,
          selectedSubOptions: this.selectedSubOptions,
          customSubOptions: this.customSubOptions,
          sideNotes: this.sideNotes,
          detailedBeforePhotos: this.detailedBeforePhotos,
          detailedAfterPhotos: this.detailedAfterPhotos,
          workPhotos: this.workPhotos,
          environmentNotes: this.environmentNotes,
          workerName: this.userInfo.name,
          workerCompany: this.userInfo.company,
          userId: common_vendor.index.getStorageSync("userId") || "temp_user",
          status: "draft",
          // Optional: link to inspection record
          relatedInspectionId: this.relatedInspectionId || null
        };
        const result = await db.collection("construction_records").add(record);
        common_vendor.index.hideLoading();
        common_vendor.index.showToast({
          title: "保存成功",
          icon: "success"
        });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      } catch (error) {
        common_vendor.index.hideLoading();
        common_vendor.index.__f__("error", "at pages/construction/index.vue:699", "保存失败:", error);
        common_vendor.index.showToast({
          title: "保存失败: " + error.message,
          icon: "none"
        });
      }
    },
    // Load saved data
    loadSavedData() {
      try {
        const savedData = common_vendor.index.getStorageSync("cleaningData");
        if (savedData) {
          this.selectedCleaningItems = savedData.selectedCleaningItems || [];
          this.selectedSubOptions = savedData.selectedSubOptions || {};
          this.sideNotes = savedData.sideNotes || {};
          this.detailedBeforePhotos = savedData.detailedBeforePhotos || {};
          this.detailedAfterPhotos = savedData.detailedAfterPhotos || {};
          this.workPhotos = savedData.workPhotos || [];
          this.environmentNotes = savedData.environmentNotes || "";
          if (savedData.customOptions) {
            this.cleaningOptions.push(...savedData.customOptions);
          }
        }
      } catch (error) {
        common_vendor.index.__f__("error", "at pages/construction/index.vue:726", "加载保存数据失败:", error);
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return common_vendor.e({
    a: $data.currentStep === "beforeCleaning" ? 1 : "",
    b: $options.isStepCompleted("beforeCleaning") ? 1 : "",
    c: common_vendor.o(($event) => $options.goToStep("beforeCleaning")),
    d: !$options.isStepCompleted("beforeCleaning") && $data.currentStep !== "afterCleaning"
  }, !$options.isStepCompleted("beforeCleaning") && $data.currentStep !== "afterCleaning" ? {} : {}, {
    e: $data.currentStep === "afterCleaning" ? 1 : "",
    f: $options.isStepCompleted("afterCleaning") ? 1 : "",
    g: !$options.isStepCompleted("beforeCleaning") && $data.currentStep !== "afterCleaning" ? 1 : "",
    h: common_vendor.o(($event) => $options.goToStep("afterCleaning")),
    i: $data.currentStep === "workPhotos" ? 1 : "",
    j: $options.isStepCompleted("workPhotos") ? 1 : "",
    k: common_vendor.o(($event) => $options.goToStep("workPhotos")),
    l: $data.currentStep === "environmentNotes" ? 1 : "",
    m: $options.isStepCompleted("environmentNotes") ? 1 : "",
    n: common_vendor.o(($event) => $options.goToStep("environmentNotes")),
    o: !$data.sidebarVisible ? 1 : "",
    p: !$data.sidebarVisible
  }, !$data.sidebarVisible ? common_vendor.e({
    q: common_vendor.o(($event) => $options.goToStep("beforeCleaning")),
    r: $data.currentStep === "beforeCleaning" ? 1 : "",
    s: $options.isStepCompleted("beforeCleaning") ? 1 : "",
    t: !$options.isStepCompleted("beforeCleaning") && $data.currentStep !== "afterCleaning"
  }, !$options.isStepCompleted("beforeCleaning") && $data.currentStep !== "afterCleaning" ? {} : {}, {
    v: common_vendor.o(($event) => $options.goToStep("afterCleaning")),
    w: $data.currentStep === "afterCleaning" ? 1 : "",
    x: $options.isStepCompleted("afterCleaning") ? 1 : "",
    y: !$options.isStepCompleted("beforeCleaning") && $data.currentStep !== "afterCleaning" ? 1 : "",
    z: common_vendor.o(($event) => $options.goToStep("workPhotos")),
    A: $data.currentStep === "workPhotos" ? 1 : "",
    B: $options.isStepCompleted("workPhotos") ? 1 : "",
    C: common_vendor.o(($event) => $options.goToStep("environmentNotes")),
    D: $data.currentStep === "environmentNotes" ? 1 : "",
    E: $options.isStepCompleted("environmentNotes") ? 1 : ""
  }) : {}, {
    F: common_vendor.t($data.sidebarVisible ? "◀" : "▶"),
    G: common_vendor.o(($event) => $data.sidebarVisible = !$data.sidebarVisible),
    H: common_vendor.t($data.userInfo.name),
    I: common_vendor.t($data.userInfo.company),
    J: $data.currentStep === "beforeCleaning"
  }, $data.currentStep === "beforeCleaning" ? common_vendor.e({
    K: $data.selectedCleaningItems.length > 0
  }, $data.selectedCleaningItems.length > 0 ? {
    L: common_vendor.f($data.selectedCleaningItems, (item, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.label),
        b: common_vendor.o(($event) => $options.removeCleaningItem(item.id), item.id),
        c: common_vendor.t(item.label),
        d: common_vendor.f($options.getSubOptionsForArea(item.value), (subOption, k1, i1) => {
          return common_vendor.e({
            a: common_vendor.t(subOption.label),
            b: $options.isSubOptionSelected(item.id, subOption.value)
          }, $options.isSubOptionSelected(item.id, subOption.value) ? {} : {}, {
            c: subOption.value,
            d: $options.isSubOptionSelected(item.id, subOption.value) ? 1 : "",
            e: common_vendor.o(($event) => $options.toggleSubOption(item.id, subOption.value), subOption.value)
          });
        }),
        e: item.value.startsWith("custom_")
      }, item.value.startsWith("custom_") ? common_vendor.e({
        f: common_vendor.t(item.label),
        g: common_vendor.t(item.label),
        h: $options.getCustomPhotoCount("before", item.value)
      }, $options.getCustomPhotoCount("before", item.value) ? {
        i: common_vendor.t($options.getCustomPhotoCount("before", item.value))
      } : {}, {
        j: common_vendor.o(($event) => $options.uploadCustomOptionPhotos("before", item.value), item.id)
      }) : {}, {
        k: $options.getSelectedSubOptions(item.id).length > 0
      }, $options.getSelectedSubOptions(item.id).length > 0 ? {
        l: common_vendor.f($options.getSelectedSubOptions(item.id), (subOption, k1, i1) => {
          return common_vendor.e({
            a: common_vendor.t($options.getSubOptionLabel(item.value, subOption)),
            b: common_vendor.t($options.getSubOptionLabel(item.value, subOption)),
            c: $options.getDetailedPhotoCount("before", item.id, subOption)
          }, $options.getDetailedPhotoCount("before", item.id, subOption) ? {
            d: common_vendor.t($options.getDetailedPhotoCount("before", item.id, subOption))
          } : {}, {
            e: common_vendor.o(($event) => $options.uploadDetailedPhotos("before", item.id, subOption), subOption),
            f: subOption
          });
        })
      } : {}, {
        m: common_vendor.t(item.label),
        n: $data.sideNotes[item.id] || "",
        o: common_vendor.o(($event) => $options.updateSideNotes(item.id, $event), item.id),
        p: item.id
      });
    })
  } : {}, {
    M: common_vendor.f($data.cleaningOptions, (option, k0, i0) => {
      return {
        a: common_vendor.t(option.label),
        b: option.value,
        c: common_vendor.o(($event) => $options.addCleaningOption(option.value), option.value)
      };
    }),
    N: $data.customBeforeOption,
    O: common_vendor.o(($event) => $data.customBeforeOption = $event.detail.value),
    P: $data.customBeforeOption.trim()
  }, $data.customBeforeOption.trim() ? {
    Q: common_vendor.o((...args) => $options.addCustomBeforeOption && $options.addCustomBeforeOption(...args))
  } : {}, {
    R: common_vendor.o(($event) => $options.goToStep("afterCleaning")),
    S: !$options.isStepCompleted("beforeCleaning"),
    T: !$options.isStepCompleted("beforeCleaning") ? 1 : ""
  }) : {}, {
    U: $data.currentStep === "afterCleaning"
  }, $data.currentStep === "afterCleaning" ? common_vendor.e({
    V: $data.selectedCleaningItems.length > 0
  }, $data.selectedCleaningItems.length > 0 ? {
    W: common_vendor.f($data.selectedCleaningItems, (item, k0, i0) => {
      return common_vendor.e({
        a: common_vendor.t(item.label),
        b: $data.sideNotes[item.id] && $data.sideNotes[item.id].trim()
      }, $data.sideNotes[item.id] && $data.sideNotes[item.id].trim() ? {
        c: common_vendor.t($data.sideNotes[item.id])
      } : {}, {
        d: item.value.startsWith("custom_")
      }, item.value.startsWith("custom_") ? common_vendor.e({
        e: common_vendor.t(item.label),
        f: common_vendor.t(item.label),
        g: $options.getCustomPhotoCount("after", item.value)
      }, $options.getCustomPhotoCount("after", item.value) ? {
        h: common_vendor.t($options.getCustomPhotoCount("after", item.value))
      } : {}, {
        i: common_vendor.o(($event) => $options.uploadCustomOptionPhotos("after", item.value), item.id)
      }) : {}, {
        j: $options.getSelectedSubOptions(item.id).length > 0
      }, $options.getSelectedSubOptions(item.id).length > 0 ? {
        k: common_vendor.f($options.getSelectedSubOptions(item.id), (subOption, k1, i1) => {
          return common_vendor.e({
            a: common_vendor.t($options.getSubOptionLabel(item.value, subOption)),
            b: common_vendor.t($options.getSubOptionLabel(item.value, subOption)),
            c: $options.getDetailedPhotoCount("after", item.id, subOption)
          }, $options.getDetailedPhotoCount("after", item.id, subOption) ? {
            d: common_vendor.t($options.getDetailedPhotoCount("after", item.id, subOption))
          } : {}, {
            e: common_vendor.o(($event) => $options.uploadDetailedPhotos("after", item.id, subOption), subOption),
            f: subOption
          });
        })
      } : {}, {
        l: item.id
      });
    })
  } : {}, {
    X: common_vendor.o(($event) => $options.goToStep("beforeCleaning")),
    Y: common_vendor.o(($event) => $options.goToStep("workPhotos")),
    Z: !$options.isAfterCleaningComplete()
  }) : {}, {
    aa: $data.currentStep === "workPhotos"
  }, $data.currentStep === "workPhotos" ? common_vendor.e({
    ab: $data.workPhotos.length
  }, $data.workPhotos.length ? {
    ac: common_vendor.t($data.workPhotos.length)
  } : {}, {
    ad: common_vendor.o((...args) => $options.uploadWorkPhotos && $options.uploadWorkPhotos(...args)),
    ae: common_vendor.o(($event) => $options.goToStep("afterCleaning")),
    af: common_vendor.o(($event) => $options.goToStep("environmentNotes"))
  }) : {}, {
    ag: $data.currentStep === "environmentNotes"
  }, $data.currentStep === "environmentNotes" ? {
    ah: $data.environmentNotes,
    ai: common_vendor.o(($event) => $data.environmentNotes = $event.detail.value),
    aj: common_vendor.o(($event) => $options.goToStep("workPhotos")),
    ak: common_vendor.o((...args) => $options.saveCleaningRecord && $options.saveCleaningRecord(...args))
  } : {}, {
    al: !$data.sidebarVisible ? 1 : ""
  });
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
wx.createPage(MiniProgramPage);
//# sourceMappingURL=../../../.sourcemap/mp-weixin/pages/construction/index.js.map
