<template>
    <view class="editor-container">
        <!-- Edit Mode -->
        <view v-if="!showPreview" class="edit-mode">
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
                                top: (ann.y * imageDisplayHeight) + 'px'
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

            <!-- Toolbar at bottom -->
            <view class="toolbar">
                <view class="toolbar-left">
                    <button v-if="!isAnnotating" class="btn-edit" @click="startAnnotation">
                        ✏️ 编辑图片
                    </button>

                    <view v-if="isAnnotating" class="annotation-tools">
                        <text class="tool-hint">点击图片添加标注</text>

                        <view class="color-picker">
                            <view class="color-dot" v-for="color in colors" :key="color" :style="{ 
                                    backgroundColor: color,
                                    border: currentColor === color ? '3px solid #fff' : '1px solid #666',
                                    transform: currentColor === color ? 'scale(1.3)' : 'scale(1)'
                                }" @click="selectColor(color)"></view>
                        </view>

                        <!-- Annotation selector dropdown -->
                        <view v-if="annotations.length > 0" class="annotation-selector">
                            <picker mode="selector" :range="annotations" range-key="text"
                                :value="selectedAnnotationIndex" @change="onAnnotationPicked">
                                <button class="btn-select-pin">
                                    {{ selectedAnnotationIndex >= 0 ? annotations[selectedAnnotationIndex].text : '选择标注' }}
                                </button>
                            </picker>

                            <button v-if="selectedAnnotationIndex >= 0" class="btn-edit-selected"
                                @click="editAnnotation(selectedAnnotationIndex)">
                                ✏️
                            </button>

                            <button v-if="selectedAnnotationIndex >= 0" class="btn-remove-selected"
                                @click="removeSelectedAnnotation">
                                🗑️
                            </button>
                        </view>

                        <!-- Pin size control -->
                        <button class="btn-pin-size" @click="togglePinSizeSlider">
                            📍 {{ pinSize }}px
                        </button>

                        <button v-if="annotations.length > 0" class="btn-undo" @click="undoAnnotation">
                            撤销
                        </button>

                        <button v-if="undoStack.length > 0" class="btn-redo" @click="redoAnnotation">
                            恢复
                        </button>
                    </view>
                </view>

                <view class="toolbar-right">
                    <button v-if="isAnnotating" class="btn-cancel-annotation" @click="cancelAnnotation">
                        取消
                    </button>
                    <button class="btn-done" @click="goToPreview">
                        下一步
                    </button>
                </view>
            </view>

            <!-- Pin size slider (shown when toggled) -->
            <view v-if="isAnnotating && showPinSizeSlider" class="pin-size-overlay" @click="togglePinSizeSlider">
                <view class="pin-size-slider-panel" @click.stop>
                    <view class="slider-header">
                        <text class="slider-title">调整标注大小</text>
                        <text class="slider-close" @click="togglePinSizeSlider">✕</text>
                    </view>
                    <text class="slider-label">大小: {{ pinSize }}px</text>
                    <slider :value="pinSize" @change="onPinSizeChange" min="8" max="32" step="2" activeColor="#007AFF"
                        backgroundColor="#ddd" block-size="12" />

                    <!-- Preview of pin size -->
                    <view class="pin-preview">
                        <text class="preview-label">预览:</text>
                        <view class="preview-pin" :style="{
                            width: pinSize + 'px',
                            height: pinSize + 'px',
                            backgroundColor: currentColor
                        }"></view>
                    </view>
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

        <!-- Text input modal -->
        <view class="text-modal" v-if="showTextModal" @click="cancelTextInput">
            <view class="text-modal-content" @click.stop>
                <text class="modal-title">{{ editingIndex >= 0 ? '编辑标注' : '添加标注说明' }}</text>
                <input class="text-input" v-model="textInput" placeholder="输入标注内容..." maxlength="30"
                    :focus="showTextModal" />
                <text class="char-count">{{ textInput.length }}/30</text>
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
                this.showTextModal = true;
            },

            onAnnotationPicked(e) {
                this.selectedAnnotationIndex = parseInt(e.detail.value);
            },

            onPinSizeChange(e) {
                // Prevent infinite loop
                if (this._updatingPinSize) return;
                this._updatingPinSize = true;

                this.pinSize = e.detail.value;
                console.log('Pin size changed to:', this.pinSize);

                // Force re-render by replacing the array
                const updated = this.annotations.map(ann => ({
                    ...ann,
                    size: this.pinSize
                }));
                this.annotations = updated;

                // Reset flag after a delay
                setTimeout(() => {
                    this._updatingPinSize = false;
                }, 100);
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
                    // Editing existing annotation
                    this.annotations[this.editingIndex].text = text;
                    this.annotations[this.editingIndex].color = this.currentColor;
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
                        const radius = ann.size || 16;

                        // Draw pin dot
                        ctx.setFillStyle(ann.color);
                        ctx.beginPath();
                        ctx.arc(x, y, radius, 0, 2 * Math.PI);
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
        transform: translate(-8px, -8px);
        pointer-events: all;
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .marker-dot {
        border-radius: 50%;
        border: 2px solid #fff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .marker-text {
        background-color: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 14px;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .zoom-indicator {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 20rpx 40rpx;
        border-radius: 12rpx;
        font-size: 40rpx;
        font-weight: bold;
        pointer-events: none;
        z-index: 100;
    }

    .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20rpx 30rpx;
        background-color: rgba(26, 26, 26, 0.95);
        backdrop-filter: blur(10px);
    }

    .toolbar-left {
        display: flex;
        align-items: center;
        gap: 15rpx;
        flex: 1;
    }

    .btn-edit {
        padding: 15rpx 30rpx;
        background-color: #007AFF;
        color: white;
        border: none;
        border-radius: 8rpx;
        font-size: 28rpx;
    }

    .annotation-tools {
        display: flex;
        align-items: center;
        gap: 20rpx;
        flex-wrap: wrap;
        flex: 1;
    }

    .tool-hint {
        color: #999;
        font-size: 24rpx;
    }

    .color-picker {
        display: flex;
        gap: 12rpx;
    }

    .color-dot {
        width: 50rpx;
        height: 50rpx;
        border-radius: 50%;
        transition: all 0.2s;
    }

    .btn-undo {
        padding: 10rpx 25rpx;
        background-color: #dc3545;
        color: white;
        border: none;
        border-radius: 8rpx;
        font-size: 24rpx;
    }

    .toolbar-right {
        display: flex;
        gap: 15rpx;
        align-items: center;
    }

    .btn-cancel-annotation {
        padding: 15rpx 25rpx;
        background-color: #666;
        color: white;
        border: none;
        border-radius: 8rpx;
        font-size: 26rpx;
    }

    .btn-done {
        padding: 15rpx 40rpx;
        background-color: #34C759;
        color: white;
        border: none;
        border-radius: 8rpx;
        font-size: 28rpx;
        font-weight: bold;
    }

    .preview-header {
        padding: 30rpx;
        background-color: #1a1a1a;
        text-align: center;
    }

    .preview-title {
        color: white;
        font-size: 32rpx;
        font-weight: bold;
    }

    .preview-content {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20rpx;
    }

    .preview-final-image {
        width: 100%;
        height: 100%;
    }

    .preview-actions {
        display: flex;
        gap: 20rpx;
        padding: 30rpx;
        background-color: #1a1a1a;
    }

    .btn-preview-back,
    .btn-preview-confirm {
        flex: 1;
        padding: 25rpx;
        border: none;
        border-radius: 12rpx;
        font-size: 30rpx;
        font-weight: bold;
    }

    .btn-preview-back {
        background-color: #666;
        color: white;
    }

    .btn-preview-confirm {
        background-color: #34C759;
        color: white;
    }

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
        padding-bottom: 100rpx;
    }

    .text-modal-content {
        width: 90%;
        background-color: white;
        border-radius: 16rpx;
        padding: 30rpx;
        animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
        from {
            transform: translateY(100%);
            opacity: 0;
        }

        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .modal-title {
        display: block;
        font-size: 30rpx;
        font-weight: bold;
        margin-bottom: 20rpx;
    }

    .text-input {
        width: 100%;
        padding: 20rpx;
        border: 2rpx solid #e5e5e5;
        border-radius: 8rpx;
        font-size: 28rpx;
        margin-bottom: 10rpx;
        background-color: #f8f8f8;
    }

    .char-count {
        display: block;
        text-align: right;
        font-size: 22rpx;
        color: #999;
        margin-bottom: 20rpx;
    }

    .modal-buttons {
        display: flex;
        gap: 15rpx;
    }

    .btn-modal-delete {
        padding: 18rpx 25rpx;
        background-color: #dc3545;
        color: white;
        border: none;
        border-radius: 8rpx;
        font-size: 26rpx;
    }

    .btn-modal-cancel,
    .btn-modal-confirm {
        flex: 1;
        padding: 18rpx;
        border: none;
        border-radius: 8rpx;
        font-size: 28rpx;
    }

    .btn-modal-cancel {
        background-color: #f0f0f0;
        color: #666;
    }

    .btn-modal-confirm {
        background-color: #007AFF;
        color: white;
    }

    .annotation-selector {
        display: flex;
        align-items: center;
        gap: 10rpx;
    }

    .btn-select-pin {
        padding: 10rpx 20rpx;
        background-color: #555;
        color: white;
        border: none;
        border-radius: 8rpx;
        font-size: 24rpx;
        max-width: 200rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .btn-edit-selected {
        padding: 10rpx 20rpx;
        background-color: #007AFF;
        color: white;
        border: none;
        border-radius: 8rpx;
        font-size: 24rpx;
    }

    .btn-remove-selected {
        padding: 10rpx 20rpx;
        background-color: #dc3545;
        color: white;
        border: none;
        border-radius: 8rpx;
        font-size: 24rpx;
    }

    .btn-pin-size {
        padding: 10rpx 20rpx;
        background-color: #444;
        color: white;
        border: none;
        border-radius: 8rpx;
        font-size: 24rpx;
    }

    .pin-size-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 200;
        display: flex;
        align-items: flex-end;
        justify-content: center;
    }

    .pin-size-slider-panel {
        width: 90%;
        background-color: rgba(26, 26, 26, 0.98);
        padding: 40rpx;
        border-radius: 24rpx 24rpx 0 0;
        backdrop-filter: blur(10px);
        margin-bottom: 0;
        min-height: 300rpx;
    }

    .slider-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 30rpx;
    }

    .slider-title {
        color: white;
        font-size: 32rpx;
        font-weight: bold;
    }

    .slider-close {
        color: white;
        font-size: 36rpx;
        padding: 0 10rpx;
        cursor: pointer;
    }

    .slider-label {
        display: block;
        color: white;
        font-size: 28rpx;
        margin-bottom: 30rpx;
    }

    .pin-preview {
        display: flex;
        align-items: center;
        gap: 20rpx;
        margin-top: 40rpx;
        padding: 30rpx;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 12rpx;
    }

    .preview-label {
        color: white;
        font-size: 26rpx;
    }

    .preview-pin {
        border-radius: 50%;
        border: 2px solid #fff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
    }

    .slider-label {
        display: block;
        color: white;
        font-size: 26rpx;
        margin-bottom: 20rpx;
    }

    .btn-redo {
        padding: 10rpx 25rpx;
        background-color: #28a745;
        color: white;
        border: none;
        border-radius: 8rpx;
        font-size: 24rpx;
    }
</style>