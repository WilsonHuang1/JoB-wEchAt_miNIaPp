<template>
    <view class="editor-container">
        <!-- Edit Mode -->
        <view v-if="!showPreview" class="edit-mode">
            <!-- Top Bar -->
            <view class="top-bar">
                <view class="top-left">
                    <text class="btn-top-cancel" @click="handleCancel">取消</text>
                    <text class="icon-btn" @click="undoAnnotation"
                        :class="{ disabled: annotations.length === 0 }">↶</text>
                    <text class="icon-btn" @click="redoAnnotation"
                        :class="{ disabled: undoStack.length === 0 }">↷</text>
                </view>
            </view>

            <!-- Photo Preview -->
            <view class="photo-preview" @touchstart="handleContainerTouchStart" @touchmove="handleContainerTouchMove"
                @touchend="handleContainerTouchEnd">
                <view class="image-wrapper" :style="{
                        transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                        width: imageDisplayWidth + 'px',
                        height: imageDisplayHeight + 'px'
                    }">
                    <image class="preview-image" :src="photoPath" mode="widthFix" @load="onImageLoad" :style="{
                            width: imageDisplayWidth + 'px'
                        }"></image>

                    <!-- Annotation markers overlay -->
                    <view v-if="isAnnotating" class="markers-overlay">
                        <view v-for="(ann, index) in annotations" :key="index" class="marker" :style="{
                                left: (ann.x * imageDisplayWidth) + 'px',
                                top: (ann.y * imageDisplayHeight) + 'px',
                                '--dot-size': (ann.size || 16) + 'px'
                            }" @tap.stop="editAnnotation(index)">
                            <view class="marker-dot" :style="{ 
                                backgroundColor: ann.color,
                                width: (ann.size || 16) + 'px',
                                height: (ann.size || 16) + 'px'
                            }"></view>
                            <view class="marker-text">{{ ann.text }}</view>
                        </view>
                    </view>
                </view>
            </view>

            <!-- Hidden canvas for preview generation -->
            <canvas canvas-id="previewCanvas" :style="{
                position: 'fixed',
                left: '-9999px',
                width: imageWidth + 'px',
                height: imageHeight + 'px'
            }"></canvas>

            <!-- Bottom Toolbar - WeChat Style -->
            <view class="bottom-toolbar">
                <!-- Main tool icons -->
                <view class="tool-icon" @click="toggleAnnotationMode">
                    <view class="icon" :class="{ active: isAnnotating }">✏️</view>
                    <text class="tool-label">标注</text>
                </view>

                <view class="tool-icon" @click="showColorPicker = !showColorPicker">
                    <view class="icon color-icon" :style="{ backgroundColor: currentColor }"></view>
                    <text class="tool-label">颜色</text>
                </view>

                <view class="tool-icon" @click="showPinManager = !showPinManager" v-if="annotations.length > 0">
                    <view class="icon">📍</view>
                    <text class="tool-label">管理</text>
                    <view class="badge">{{ annotations.length }}</view>
                </view>

                <view class="tool-icon" @click="showPinSizeSlider = !showPinSizeSlider">
                    <view class="icon">🔍</view>
                    <text class="tool-label">{{ pinSize }}px</text>
                </view>

                <view class="spacer"></view>

                <!-- Done button -->
                <view class="btn-done-wechat" @click="goToPreview">
                    <text>完成</text>
                </view>
            </view>

            <view class="zoom-indicator" v-if="showZoomIndicator">
                {{ Math.round(scale * 100) }}%
            </view>
        </view>

        <!-- Preview Mode -->
        <view v-else class="preview-mode">
            <view class="preview-header">
                <text class="preview-title">预览</text>
            </view>

            <view class="preview-content">
                <image class="preview-final-image" :src="previewImagePath" mode="aspectFit"></image>
            </view>

            <view class="preview-actions">
                <button class="btn-preview-back" @click="backToEdit">
                    重新编辑
                </button>
                <button class="btn-preview-confirm" @click="confirmAndSubmit">
                    确认使用
                </button>
            </view>
        </view>

        <!-- Color Picker Panel -->
        <view v-if="showColorPicker" class="popup-overlay" @click="showColorPicker = false">
            <view class="popup-panel" @click.stop>
                <view class="panel-header">
                    <text class="panel-title">选择颜色</text>
                    <text class="panel-close" @click="showColorPicker = false">✕</text>
                </view>
                <view class="color-grid">
                    <view v-for="color in colors" :key="color" class="color-option" @click="selectColor(color)">
                        <view class="color-circle" :style="{ backgroundColor: color }">
                            <text v-if="currentColor === color" class="check-mark">✓</text>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <!-- Pin Manager Panel -->
        <view v-if="showPinManager" class="popup-overlay" @click="showPinManager = false">
            <view class="popup-panel" @click.stop>
                <view class="panel-header">
                    <text class="panel-title">管理标注</text>
                    <text class="panel-close" @click="showPinManager = false">✕</text>
                </view>
                <view class="pin-list">
                    <view v-for="(ann, index) in annotations" :key="index" class="pin-item">
                        <view class="pin-dot-small" :style="{ backgroundColor: ann.color }"></view>
                        <text class="pin-text">{{ ann.text }}</text>
                        <view class="pin-actions">
                            <text class="pin-action-btn edit" @click="editAnnotation(index)">✏️</text>
                            <text class="pin-action-btn delete" @click="deleteAnnotationByIndex(index)">🗑️</text>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <!-- Pin Size Slider -->
        <view v-if="showPinSizeSlider" class="popup-overlay" @click="showPinSizeSlider = false">
            <view class="popup-panel" @click.stop>
                <view class="panel-header">
                    <text class="panel-title">调整大小</text>
                    <text class="panel-close" @click="showPinSizeSlider = false">✕</text>
                </view>
                <view class="size-content">
                    <text class="size-label">标注大小: {{ pinSize }}px</text>
                    <slider :value="pinSize" @change="onPinSizeChange" min="8" max="32" step="2" activeColor="#07C160"
                        backgroundColor="#e5e5e5" block-size="20" />
                    <view class="size-preview">
                        <text class="preview-text">预览:</text>
                        <view class="preview-dot" :style="{
                            width: pinSize + 'px',
                            height: pinSize + 'px',
                            backgroundColor: currentColor
                        }"></view>
                    </view>
                </view>
            </view>
        </view>

        <!-- Text Input Modal -->
        <view class="text-modal" v-if="showTextModal" @click="cancelTextInput">
            <view class="text-modal-content" @click.stop>
                <text class="modal-title">{{ editingIndex >= 0 ? '编辑标注' : '添加标注说明' }}</text>
                <input class="text-input" v-model="textInput" placeholder="输入标注内容..." maxlength="30"
                    :focus="showTextModal" />
                <text class="char-count">{{ textInput.length }}/30</text>
                <view v-if="editingIndex >= 0" class="modal-size-control">
                    <text class="size-label-modal">大小: {{ pinSize }}px</text>
                    <slider :value="pinSize" @change="onPinSizeChange" min="8" max="32" step="2" activeColor="#07C160"
                        backgroundColor="#e5e5e5" block-size="12" />
                </view>

                <!-- Color picker when editing -->
                <view v-if="editingIndex >= 0" class="modal-color-control">
                    <text class="color-label-modal">颜色</text>
                    <view class="modal-color-grid">
                        <view v-for="color in colors" :key="color" class="modal-color-option"
                            @click="selectColor(color)">
                            <view class="modal-color-circle" :style="{ backgroundColor: color }">
                                <text v-if="currentColor === color" class="modal-check-mark">✓</text>
                            </view>
                        </view>
                    </view>
                </view>

                <view class="modal-buttons">
                    <button v-if="editingIndex >= 0" class="btn-modal-delete" @click="deleteAnnotation">删除</button>
                    <button class="btn-modal-cancel" @click="cancelTextInput">取消</button>
                    <button class="btn-modal-confirm" @click="confirmTextInput">确定</button>
                </view>
            </view>
        </view>
    </view>
</template>

<script>
    export default {
        data() {
            return {
                photoPath: '',
                showPreview: false,
                previewImagePath: '',

                isAnnotating: false,
                _processingTap: false,

                imageWidth: 0,
                imageHeight: 0,
                imageDisplayWidth: 0,
                imageDisplayHeight: 0,
                containerWidth: 0,
                containerHeight: 0,

                showColorPicker: false,
                showPinManager: false,

                currentColor: '#FF0000',
                colors: ['#FF0000', '#FFA500', '#FFFF00', '#00FF00', '#0000FF', '#FFFFFF'],

                _updatingPinSize: false,

                annotations: [],
                undoStack: [],

                showTextModal: false,
                textInput: '',
                editingIndex: -1,
                pendingX: 0,
                pendingY: 0,

                scale: 1,
                translateX: 0,
                translateY: 0,
                showZoomIndicator: false,
                zoomIndicatorTimer: null,

                lastTouchX: 0,
                lastTouchY: 0,
                initialDistance: 0,
                initialScale: 1,
                isPanning: false,
                isTwoFinger: false,
                touchStartTime: 0,
                touchStartX: 0,
                touchStartY: 0,
                hasMoved: false,

                selectedAnnotationIndex: -1,
                pinSize: 16, // default pin size
                showPinSizeSlider: false
            };
        },

        onLoad(options) {
            if (options.photo) {
                this.photoPath = decodeURIComponent(options.photo);
            }
        },

        methods: {
            onImageLoad(e) {
                uni.getImageInfo({
                    src: this.photoPath,
                    success: (res) => {
                        this.imageWidth = res.width;
                        this.imageHeight = res.height;

                        const query = uni.createSelectorQuery().in(this);
                        query.select('.photo-preview').boundingClientRect(data => {
                            if (data) {
                                this.containerWidth = data.width;
                                this.containerHeight = data.height;

                                const containerRatio = this.containerWidth / this.containerHeight;
                                const imageRatio = this.imageWidth / this.imageHeight;

                                if (imageRatio > containerRatio) {
                                    this.imageDisplayWidth = this.containerWidth;
                                    this.imageDisplayHeight = this.containerWidth / imageRatio;
                                } else {
                                    this.imageDisplayHeight = this.containerHeight;
                                    this.imageDisplayWidth = this.containerHeight * imageRatio;
                                }

                                console.log('Image ready:', {
                                    original: {
                                        w: this.imageWidth,
                                        h: this.imageHeight
                                    },
                                    display: {
                                        w: this.imageDisplayWidth,
                                        h: this.imageDisplayHeight
                                    }
                                });
                            }
                        }).exec();
                    }
                });
            },

            startAnnotation() {
                this.isAnnotating = true;
                this.scale = 1;
                this.translateX = 0;
                this.translateY = 0;

                uni.showToast({
                    title: '点击图片添加标注',
                    icon: 'none',
                    duration: 2000
                });
            },

            cancelAnnotation() {
                if (this.annotations.length > 0) {
                    uni.showModal({
                        title: '取消标注',
                        content: '确定要取消所有标注吗？',
                        success: (res) => {
                            if (res.confirm) {
                                this.annotations = [];
                                this.isAnnotating = false;
                            }
                        }
                    });
                } else {
                    this.isAnnotating = false;
                }
            },

            selectColor(color) {
                this.currentColor = color;
            },

            undoAnnotation() {
                if (this.annotations.length > 0) {
                    const removed = this.annotations.pop();
                    this.undoStack.push(removed); // Store in undo stack

                    // Clear undo stack after 5 seconds
                    setTimeout(() => {
                        this.undoStack = [];
                    }, 5000);
                }
            },

            redoAnnotation() {
                if (this.undoStack.length > 0) {
                    const restored = this.undoStack.pop();
                    this.annotations.push(restored);
                }
            },

            toggleAnnotationMode() {
                if (this.isAnnotating) {
                    this.cancelAnnotation();
                } else {
                    this.startAnnotation();
                }
            },

            deleteAnnotationByIndex(index) {
                this.annotations.splice(index, 1);
                if (this.annotations.length === 0) {
                    this.showPinManager = false;
                }
            },

            handleCancel() {
                if (this.isAnnotating && this.annotations.length > 0) {
                    uni.showModal({
                        title: '取消编辑',
                        content: '确定要取消所有标注吗？',
                        success: (res) => {
                            if (res.confirm) {
                                uni.navigateBack();
                            }
                        }
                    });
                } else {
                    uni.navigateBack();
                }
            },

            handleContainerTouchStart(e) {
                this.touchStartTime = Date.now();
                this.hasMoved = false;

                const touches = e.touches;

                if (touches.length === 1) {
                    this.isPanning = true;
                    this.lastTouchX = touches[0].pageX;
                    this.lastTouchY = touches[0].pageY;
                    this.touchStartX = touches[0].pageX;
                    this.touchStartY = touches[0].pageY;
                } else if (touches.length === 2) {
                    this.isTwoFinger = true;
                    this.isPanning = false;

                    const dx = touches[0].pageX - touches[1].pageX;
                    const dy = touches[0].pageY - touches[1].pageY;
                    this.initialDistance = Math.sqrt(dx * dx + dy * dy);
                    this.initialScale = this.scale;

                    this.showZoomIndicator = true;
                }
            },

            handleContainerTouchMove(e) {
                const touches = e.touches;

                if (touches.length === 1 && this.isPanning && !this.isTwoFinger) {
                    const deltaX = touches[0].pageX - this.lastTouchX;
                    const deltaY = touches[0].pageY - this.lastTouchY;

                    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                        this.hasMoved = true;
                    }

                    this.translateX += deltaX;
                    this.translateY += deltaY;

                    this.lastTouchX = touches[0].pageX;
                    this.lastTouchY = touches[0].pageY;
                } else if (touches.length === 2) {
                    this.hasMoved = true;

                    const dx = touches[0].pageX - touches[1].pageX;
                    const dy = touches[0].pageY - touches[1].pageY;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    const newScale = this.initialScale * (distance / this.initialDistance);
                    this.scale = Math.max(0.5, Math.min(3, newScale));

                    this.showZoomIndicator = true;
                }
            },

            handleContainerTouchEnd(e) {
                const touchDuration = Date.now() - this.touchStartTime;

                // If it's a tap (not pan/zoom) and we're annotating
                if (!this.hasMoved && touchDuration < 300 && this.isAnnotating && e.changedTouches.length > 0) {
                    // Prevent multiple executions
                    if (this._processingTap) {
                        return;
                    }
                    this._processingTap = true;

                    const touch = e.changedTouches[0];

                    setTimeout(() => {
                        const query = uni.createSelectorQuery().in(this);
                        query.select('.photo-preview').boundingClientRect(containerRect => {
                            if (containerRect) {
                                // Calculate the center of the container
                                const containerCenterX = containerRect.width / 2;
                                const containerCenterY = containerRect.height / 2;

                                // Calculate the center of the scaled image
                                const scaledImageWidth = this.imageDisplayWidth * this.scale;
                                const scaledImageHeight = this.imageDisplayHeight * this.scale;

                                // Calculate image top-left position in container
                                const imageLeft = containerCenterX - (scaledImageWidth / 2) + this
                                    .translateX;
                                const imageTop = containerCenterY - (scaledImageHeight / 2) + this
                                    .translateY;

                                // Calculate tap position relative to container
                                const tapX = touch.pageX - containerRect.left;
                                const tapY = touch.pageY - containerRect.top;

                                // Calculate position relative to the scaled image
                                const relX = (tapX - imageLeft) / this.scale;
                                const relY = (tapY - imageTop) / this.scale;

                                // Normalize to 0-1 based on original image display size
                                const normalizedX = relX / this.imageDisplayWidth;
                                const normalizedY = relY / this.imageDisplayHeight;

                                console.log('Debug:', {
                                    tap: {
                                        x: tapX,
                                        y: tapY
                                    },
                                    imagePos: {
                                        left: imageLeft,
                                        top: imageTop
                                    },
                                    relative: {
                                        x: relX,
                                        y: relY
                                    },
                                    normalized: {
                                        x: normalizedX,
                                        y: normalizedY
                                    }
                                });

                                // Check if tap is within image bounds
                                if (normalizedX >= 0 && normalizedX <= 1 && normalizedY >= 0 &&
                                    normalizedY <= 1) {
                                    this.pendingX = normalizedX;
                                    this.pendingY = normalizedY;
                                    this.editingIndex = -1;
                                    this.textInput = '';
                                    this.showTextModal = true;

                                    console.log('Adding annotation at:', {
                                        x: normalizedX,
                                        y: normalizedY
                                    });
                                }
                            }

                            // Reset flag
                            this._processingTap = false;
                        }).exec();
                    }, 50);
                } else {
                    this._processingTap = false;
                }

                this.isPanning = false;
                this.isTwoFinger = false;

                if (this.showZoomIndicator) {
                    clearTimeout(this.zoomIndicatorTimer);
                    this.zoomIndicatorTimer = setTimeout(() => {
                        this.showZoomIndicator = false;
                    }, 1000);
                }
            },

            editAnnotation(index) {
                this.editingIndex = index;
                this.textInput = this.annotations[index].text;
                this.currentColor = this.annotations[index].color;
                this.pinSize = this.annotations[index].size || 16;
                this.showTextModal = true;
            },

            onAnnotationPicked(e) {
                this.selectedAnnotationIndex = parseInt(e.detail.value);
            },

            onPinSizeChange(e) {
                if (this._updatingPinSize) return;
                this._updatingPinSize = true;

                this.pinSize = e.detail.value;

                // Update the selected annotation's size if one is selected
                if (this.selectedAnnotationIndex >= 0) {
                    this.annotations[this.selectedAnnotationIndex].size = this.pinSize;
                    // Force reactivity update
                    this.annotations = [...this.annotations];
                }

                this.$nextTick(() => {
                    this._updatingPinSize = false;
                });
            },

            deleteAnnotation() {
                if (this.editingIndex >= 0) {
                    this.annotations.splice(this.editingIndex, 1);
                    this.showTextModal = false;
                    this.textInput = '';
                    this.editingIndex = -1;
                    this._processingTap = false;
                }
            },

            selectAnnotation(index) {
                this.selectedAnnotationIndex = index;
            },

            removeSelectedAnnotation() {
                if (this.selectedAnnotationIndex >= 0) {
                    this.annotations.splice(this.selectedAnnotationIndex, 1);
                    this.selectedAnnotationIndex = -1;
                }
            },

            togglePinSizeSlider() {
                this.showPinSizeSlider = !this.showPinSizeSlider;
            },

            cancelTextInput() {
                this.showTextModal = false;
                this.textInput = '';
                this.editingIndex = -1;
                this._processingTap = false;
            },

            confirmTextInput() {
                const text = this.textInput.trim() || '标注';

                if (this.editingIndex >= 0) {
                    // Editing existing annotation - update size too
                    this.annotations[this.editingIndex].text = text;
                    this.annotations[this.editingIndex].color = this.currentColor;
                    this.annotations[this.editingIndex].size = this.pinSize; // Add this line
                } else {
                    // Adding new annotation
                    this.annotations.push({
                        x: this.pendingX,
                        y: this.pendingY,
                        text: text,
                        color: this.currentColor,
                        size: this.pinSize
                    });

                    console.log('Annotation added:', this.annotations[this.annotations.length - 1]);
                }

                this._processingTap = false;
                this.showTextModal = false;
                this.textInput = '';
                this.editingIndex = -1;
            },

            async goToPreview() {
                uni.showLoading({
                    title: '生成预览中...'
                });

                try {
                    // Create a temporary canvas context
                    const ctx = uni.createCanvasContext('previewCanvas', this);

                    // Get image info first
                    const imgInfo = await new Promise((resolve, reject) => {
                        uni.getImageInfo({
                            src: this.photoPath,
                            success: resolve,
                            fail: reject
                        });
                    });

                    const canvasWidth = imgInfo.width;
                    const canvasHeight = imgInfo.height;

                    // Draw the base image
                    ctx.drawImage(this.photoPath, 0, 0, canvasWidth, canvasHeight);

                    // Draw all annotations
                    this.annotations.forEach(ann => {
                        const x = ann.x * canvasWidth;
                        const y = ann.y * canvasHeight;
                        const radius = (ann.size || 16) / 2;

                        // Draw pin dot
                        ctx.setFillStyle(ann.color);
                        ctx.beginPath();
                        ctx.arc(x, y, (ann.size || 16) / 2, 0, 2 * Math.PI);
                        ctx.fill();

                        // Draw white border
                        ctx.setStrokeStyle('#FFFFFF');
                        ctx.setLineWidth(3);
                        ctx.stroke();

                        // Draw text background
                        ctx.setFontSize(24);
                        ctx.setFillStyle('rgba(0, 0, 0, 0.8)');
                        const textMetrics = ctx.measureText(ann.text);
                        const textWidth = textMetrics.width || ann.text.length * 24;
                        ctx.fillRect(x + radius + 5, y - 20, textWidth + 16, 32);

                        // Draw text
                        ctx.setFillStyle('#FFFFFF');
                        ctx.fillText(ann.text, x + radius + 13, y + 2);
                    });

                    // Render to get temp file
                    ctx.draw(false, () => {
                        setTimeout(() => {
                            uni.canvasToTempFilePath({
                                canvasId: 'previewCanvas',
                                destWidth: canvasWidth,
                                destHeight: canvasHeight,
                                success: (res) => {
                                    this.previewImagePath = res.tempFilePath;
                                    this.showPreview = true;
                                    uni.hideLoading();
                                },
                                fail: (err) => {
                                    console.error('Canvas to temp file failed:', err);
                                    uni.hideLoading();
                                    uni.showToast({
                                        title: '生成预览失败',
                                        icon: 'none'
                                    });
                                }
                            }, this);
                        }, 500);
                    });
                } catch (error) {
                    console.error('生成预览失败:', error);
                    uni.hideLoading();
                    uni.showToast({
                        title: '生成预览失败: ' + error.message,
                        icon: 'none'
                    });
                }
            },

            backToEdit() {
                this.showPreview = false;
                this.previewImagePath = '';
            },

            confirmAndSubmit() {
                const pages = getCurrentPages();
                const prevPage = pages[pages.length - 2];

                if (prevPage) {
                    prevPage.$vm.handleAnnotatedPhoto(this.previewImagePath);
                }

                uni.navigateBack();
            }
        }
    };
</script>

<style scoped>
    .editor-container {
        width: 100vw;
        height: 100vh;
        background-color: #000;
        display: flex;
        flex-direction: column;
    }

    .edit-mode,
    .preview-mode {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    /* Top Bar */
    .top-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20rpx 30rpx;
        padding-top: 60rpx;
        /* Add extra padding for mini app bar */
        background-color: rgba(0, 0, 0, 0.5);
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100;
    }

    .top-left {
        display: flex;
        align-items: center;
        gap: 30rpx;
    }

    .btn-top-cancel {
        color: white;
        font-size: 32rpx;
        padding: 10rpx;
    }

    .top-actions {
        display: flex;
        gap: 30rpx;
    }

    .icon-btn {
        color: white;
        font-size: 48rpx;
        padding: 10rpx;
        font-weight: bold;
    }

    .icon-btn.disabled {
        color: #666;
        opacity: 0.5;
    }

    /* Photo Preview */
    .photo-preview {
        flex: 1;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .image-wrapper {
        position: relative;
        transform-origin: center center;
        transition: none;
    }

    .preview-image {
        display: block;
        user-select: none;
        pointer-events: none;
    }

    .markers-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
    }

    .marker {
        position: absolute;
        pointer-events: all;
        display: flex;
        align-items: center;
        gap: 8rpx;
    }

    .marker-dot {
        border-radius: 50%;
        border: 3rpx solid #fff;
        box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.3);
        flex-shrink: 0;
        /* Center the dot on the coordinates */
        margin-left: calc(var(--dot-size) / -2);
        margin-top: calc(var(--dot-size) / -2);
    }

    .marker-text {
        background-color: rgba(0, 0, 0, 0.85);
        color: #fff;
        padding: 6rpx 16rpx;
        border-radius: 8rpx;
        font-size: 24rpx;
        white-space: nowrap;
        box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.3);
        margin-left: 4rpx;
    }

    /* Bottom Toolbar - WeChat Style */
    .bottom-toolbar {
        display: flex;
        align-items: center;
        padding: 20rpx 30rpx;
        background-color: rgba(26, 26, 26, 0.98);
        gap: 40rpx;
    }

    .tool-icon {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8rpx;
        position: relative;
    }

    .icon {
        width: 80rpx;
        height: 80rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 48rpx;
        border-radius: 12rpx;
        background-color: rgba(255, 255, 255, 0.1);
        transition: all 0.2s;
    }

    .icon.active {
        background-color: rgba(7, 193, 96, 0.2);
        transform: scale(1.1);
    }

    .color-icon {
        border: 4rpx solid white;
        box-shadow: 0 0 0 2rpx rgba(255, 255, 255, 0.3);
    }

    .tool-label {
        color: white;
        font-size: 22rpx;
    }

    .badge {
        position: absolute;
        top: -8rpx;
        right: -8rpx;
        background-color: #ff4444;
        color: white;
        font-size: 20rpx;
        padding: 2rpx 10rpx;
        border-radius: 20rpx;
        min-width: 32rpx;
        text-align: center;
    }

    .spacer {
        flex: 1;
    }

    .btn-done-wechat {
        background-color: #07C160;
        color: white;
        padding: 20rpx 50rpx;
        border-radius: 12rpx;
        font-size: 32rpx;
        font-weight: bold;
    }

    /* Popup Overlay */
    .popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.6);
        z-index: 500;
        display: flex;
        align-items: flex-end;
        justify-content: center;
    }

    .popup-panel {
        width: 100%;
        background-color: white;
        border-radius: 32rpx 32rpx 0 0;
        padding: 40rpx;
        max-height: 70vh;
        overflow-y: auto;
        animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
        from {
            transform: translateY(100%);
        }

        to {
            transform: translateY(0);
        }
    }

    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 40rpx;
    }

    .panel-title {
        font-size: 36rpx;
        font-weight: bold;
        color: #333;
    }

    .panel-close {
        font-size: 48rpx;
        color: #999;
        padding: 0 20rpx;
    }

    /* Color Picker */
    .color-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 30rpx;
    }

    .color-option {
        display: flex;
        justify-content: center;
    }

    .color-circle {
        width: 100rpx;
        height: 100rpx;
        border-radius: 50%;
        border: 4rpx solid #e5e5e5;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .check-mark {
        color: white;
        font-size: 48rpx;
        font-weight: bold;
        text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
    }

    /* Pin Manager */
    .pin-list {
        display: flex;
        flex-direction: column;
        gap: 20rpx;
    }

    .pin-item {
        display: flex;
        align-items: center;
        padding: 30rpx;
        background-color: #f8f8f8;
        border-radius: 16rpx;
        gap: 20rpx;
    }

    .pin-dot-small {
        width: 40rpx;
        height: 40rpx;
        border-radius: 50%;
        border: 3rpx solid white;
        box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
    }

    .pin-text {
        flex: 1;
        font-size: 28rpx;
        color: #333;
    }

    .pin-actions {
        display: flex;
        gap: 20rpx;
    }

    .pin-action-btn {
        font-size: 36rpx;
        padding: 10rpx 20rpx;
    }

    /* Size Slider */
    .size-content {
        padding: 20rpx 0;
    }

    .size-label {
        display: block;
        font-size: 28rpx;
        color: #333;
        margin-bottom: 30rpx;
    }

    .size-preview {
        display: flex;
        align-items: center;
        gap: 30rpx;
        margin-top: 40rpx;
        padding: 40rpx;
        background-color: #f8f8f8;
        border-radius: 16rpx;
        justify-content: center;
    }

    .preview-text {
        font-size: 28rpx;
        color: #666;
    }

    .preview-dot {
        border-radius: 50%;
        border: 3rpx solid white;
        box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.2);
    }

    /* Zoom Indicator */
    .zoom-indicator {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 30rpx 60rpx;
        border-radius: 16rpx;
        font-size: 48rpx;
        font-weight: bold;
        pointer-events: none;
        z-index: 100;
    }

    /* Preview Mode */
    .preview-header {
        padding: 30rpx;
        background-color: #1a1a1a;
        text-align: center;
    }

    .preview-title {
        color: white;
        font-size: 36rpx;
        font-weight: bold;
    }

    .preview-content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 30rpx;
    }

    .preview-final-image {
        width: 100%;
        height: 100%;
    }

    .preview-actions {
        display: flex;
        gap: 30rpx;
        padding: 30rpx;
        background-color: #1a1a1a;
    }

    .btn-preview-back,
    .btn-preview-confirm {
        flex: 1;
        padding: 30rpx;
        border: none;
        border-radius: 16rpx;
        font-size: 32rpx;
        font-weight: bold;
    }

    .btn-preview-back {
        background-color: #666;
        color: white;
    }

    .btn-preview-confirm {
        background-color: #07C160;
        color: white;
    }

    /* Text Modal */
    .text-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: flex-end;
        justify-content: center;
        z-index: 9999;
    }

    .text-modal-content {
        width: 100%;
        background-color: white;
        border-radius: 32rpx 32rpx 0 0;
        padding: 40rpx;
        animation: slideUp 0.3s ease-out;
    }

    .modal-title {
        display: block;
        font-size: 36rpx;
        font-weight: bold;
        margin-bottom: 30rpx;
        color: #333;
    }

    .text-input {
        width: 100%;
        padding: 30rpx;
        border: 2rpx solid #e5e5e5;
        border-radius: 16rpx;
        font-size: 32rpx;
        margin-bottom: 20rpx;
        background-color: #f8f8f8;
    }

    .char-count {
        display: block;
        text-align: right;
        font-size: 24rpx;
        color: #999;
        margin-bottom: 30rpx;
    }

    .modal-buttons {
        display: flex;
        gap: 20rpx;
    }

    .btn-modal-delete {
        padding: 25rpx 30rpx;
        background-color: #ff4444;
        color: white;
        border: none;
        border-radius: 12rpx;
        font-size: 28rpx;
    }

    .btn-modal-cancel,
    .btn-modal-confirm {
        flex: 1;
        padding: 25rpx;
        border: none;
        border-radius: 12rpx;
        font-size: 30rpx;
        font-weight: bold;
    }

    .btn-modal-cancel {
        background-color: #f0f0f0;
        color: #666;
    }

    .btn-modal-confirm {
        background-color: #07C160;
        color: white;
    }

    .modal-size-control {
        margin: 20rpx 0;
        padding: 20rpx;
        background-color: #f8f8f8;
        border-radius: 12rpx;
    }

    .size-label-modal {
        display: block;
        font-size: 26rpx;
        color: #666;
        margin-bottom: 20rpx;
    }

    .modal-color-control {
        margin: 20rpx 0;
        padding: 30rpx;
        background-color: #f8f8f8;
        border-radius: 12rpx;
    }

    .color-label-modal {
        display: block;
        font-size: 26rpx;
        color: #666;
        margin-bottom: 20rpx;
    }

    .modal-color-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 20rpx;
    }

    .modal-color-option {
        display: flex;
        justify-content: center;
    }

    .modal-color-circle {
        width: 70rpx;
        height: 70rpx;
        border-radius: 50%;
        border: 3rpx solid #ddd;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }

    .modal-check-mark {
        color: white;
        font-size: 36rpx;
        font-weight: bold;
        text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
    }
</style>