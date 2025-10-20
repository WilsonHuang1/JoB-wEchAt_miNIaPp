'use strict';
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
    ImageRun
} = require('docx');

const db = uniCloud.database();

const path = require('path');
const fs = require('fs');

exports.main = async (event, context) => {
    const {
        recordId,
        recordType
    } = event;

    // Validate input
    if (!recordId || !recordType) {
        return {
            code: 400,
            message: '缺少必需参数: recordId 和 recordType'
        };
    }

    try {
        // Fetch record from database
        let record;
        if (recordType === 'tankan') {
            const res = await db.collection('tankan_records').doc(recordId).get();
            record = res.data[0];
        } else if (recordType === 'construction') {
            const res = await db.collection('construction_records').doc(recordId).get();
            record = res.data[0];
        } else if (recordType === 'business') {
            const res = await db.collection('business_info').doc(recordId).get();
            record = res.data[0];
        } else {
            return {
                code: 400,
                message: '无效的记录类型'
            };
        }

        if (!record) {
            return {
                code: 404,
                message: '记录不存在'
            };
        }

        // Generate report based on format
        let buffer;
        let fileExtension;

        const format = event.format || 'excel'; // Default to excel if not specified

        if (format === 'pdf') {
            fileExtension = 'pdf';
            if (recordType === 'tankan') {
                buffer = await generateTankanPDF(record);
            } else if (recordType === 'construction') {
                buffer = await generateConstructionPDF(record);
            } else if (recordType === 'business') {
                buffer = await generateBusinessPDF(record);
            }
        } else if (format === 'word') {
            fileExtension = 'docx';
            if (recordType === 'tankan') {
                buffer = await generateTankanWord(record);
            } else if (recordType === 'construction') {
                buffer = await generateConstructionWord(record);
            } else if (recordType === 'business') {
                buffer = await generateBusinessWord(record);
            }
        } else {
            // Excel format (existing code)
            fileExtension = 'xlsx';
            if (recordType === 'tankan') {
                buffer = await generateTankanReport(record);
            } else if (recordType === 'construction') {
                buffer = await generateConstructionReport(record);
            } else if (recordType === 'business') {
                buffer = await generateBusinessReport(record);
            }
        }

        // Upload to cloud storage
        const fileName = `${recordType}_report_${Date.now()}.${fileExtension}`;
        const uploadResult = await uniCloud.uploadFile({
            cloudPath: `reports/${fileName}`,
            fileContent: buffer
        });

        return {
            code: 200,
            message: '报告生成成功',
            data: {
                fileID: uploadResult.fileID,
                fileName: fileName,
                downloadUrl: uploadResult.fileID
            }
        };

    } catch (error) {
        console.error('报告生成失败:', error);
        return {
            code: 500,
            message: '报告生成失败: ' + error.message,
            error: error.message
        };
    }
};

async function generateTankanReport(record) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('踏勘报告');

    // Set column widths to match template
    sheet.columns = [{
            width: 15
        }, // A - 类型 or empty space
        {
            width: 20
        }, // B - 位置
        {
            width: 25
        }, // C - 型号规格
        {
            width: 12
        }, // D - 单位
        {
            width: 10
        }, // E - 数量
        {
            width: 15
        }, // F - 频次
        {
            width: 12
        } // G - 照片数量
    ];

    let rowIndex = 1;

    // Row 1: Title (Column A empty for logo, B-G merged for title)
    const titleRow = sheet.getRow(rowIndex);
    sheet.mergeCells(`B${rowIndex}:G${rowIndex}`);
    const titleCell = sheet.getCell(`B${rowIndex}`);
    titleCell.value = '现场踏勘报告';
    titleCell.font = {
        size: 18,
        bold: true,
        color: {
            argb: 'FFFFFFFF'
        }
    };
    titleCell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
            argb: 'FF4472C4'
        }
    };
    // Add border to column A too
    sheet.getCell(`A${rowIndex}`).border = getAllBorders();
    titleCell.border = getAllBorders();
    titleRow.height = 40;
    rowIndex++;

    // Section Header: 基本信息
    sheet.mergeCells(`A${rowIndex}:G${rowIndex}`);
    const basicInfoHeader = sheet.getCell(`A${rowIndex}`);
    basicInfoHeader.value = '基本信息';
    basicInfoHeader.font = {
        size: 14,
        bold: true
    };
    basicInfoHeader.alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };
    basicInfoHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
            argb: 'FFD9D9D9'
        }
    };
    basicInfoHeader.border = getAllBorders();
    sheet.getRow(rowIndex).height = 30;
    rowIndex++;

    // Basic Info rows
    addBorderedDataRow(sheet, rowIndex++, 'A', '归属公司', 'B:G', record.guishu || '-');
    addBorderedDataRow(sheet, rowIndex++, 'A', '踏勘人员', 'B:G', record.tankanyuan || '-');
    addBorderedDataRow(sheet, rowIndex++, 'A', '项目名称', 'B:G', record.mingcheng || '-');

    // 踏勘地点 - taller row
    const locationRow = addBorderedDataRow(sheet, rowIndex++, 'A', '踏勘地点', 'B:G', record.didian || '-');
    locationRow.height = 60;

    if (record.location) {
        addBorderedDataRow(sheet, rowIndex++, 'A', 'GPS坐标', 'B:G',
            `纬度: ${record.location.latitude}, 经度: ${record.location.longitude}`);
    }

    const createDate = new Date(record.createTime);
    addBorderedDataRow(sheet, rowIndex++, 'A', '创建时间', 'B:G', createDate.toLocaleString('zh-CN'));

    // Section Header: 环境信息
    sheet.mergeCells(`A${rowIndex}:G${rowIndex}`);
    const envHeader = sheet.getCell(`A${rowIndex}`);
    envHeader.value = '环境信息';
    envHeader.font = {
        size: 14,
        bold: true
    };
    envHeader.alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };
    envHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
            argb: 'FFD9D9D9'
        }
    };
    envHeader.border = getAllBorders();
    sheet.getRow(rowIndex).height = 30;
    rowIndex++;

    // Environment Info rows
    const envLabels = {
        parkingEntrance: '停车场入口',
        recommendedParking: '电梯入口',
        elevatorEntrance: '楼顶环境'
    };

    addBorderedDataRow(sheet, rowIndex++, 'A', '停车场入口', 'B:G',
        record.environmentData?.parkingEntrance || '-');
    addBorderedDataRow(sheet, rowIndex++, 'A', '电梯入口', 'B:G',
        record.environmentData?.elevatorEntrance || '-');
    addBorderedDataRow(sheet, rowIndex++, 'A', '楼顶环境', 'B:G',
        record.environmentData?.rooftopEnvironment || '-');

    // Section Header: 清洗范围详情
    sheet.mergeCells(`A${rowIndex}:G${rowIndex}`);
    const cleaningHeader = sheet.getCell(`A${rowIndex}`);
    cleaningHeader.value = '清洗范围详情';
    cleaningHeader.font = {
        size: 14,
        bold: true
    };
    cleaningHeader.alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };
    cleaningHeader.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
            argb: 'FFD9D9D9'
        }
    };
    cleaningHeader.border = getAllBorders();
    sheet.getRow(rowIndex).height = 30;
    rowIndex++;

    // Table Header Row
    const headerRow = sheet.getRow(rowIndex);
    headerRow.values = ['类型', '位置', '型号规格', '单位', '数量', '频次', '照片数量'];
    headerRow.font = {
        bold: true
    };
    headerRow.alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };
    for (let col = 1; col <= 7; col++) {
        headerRow.getCell(col).border = getAllBorders();
    }
    headerRow.height = 25;
    rowIndex++;

    // Add cleaning items
    if (record.qingxifanwei && record.qingxifanwei.length > 0) {
        for (let index = 0; index < record.qingxifanwei.length; index++) {
            const item = record.qingxifanwei[index];
            const photoCount = item.specs?.photoBefore?.length || 0;

            // Data row
            const dataRow = sheet.getRow(rowIndex);
            dataRow.values = [
                item.type || '-',
                item.specs?.position || '-',
                item.specs?.model || '-',
                item.specs?.unit || '-',
                item.specs?.quantity || '-',
                item.specs?.frequency || '-',
                photoCount + '张'
            ];
            dataRow.alignment = {
                vertical: 'middle',
                wrapText: true
            };

            // Add borders to each cell
            for (let col = 1; col <= 7; col++) {
                dataRow.getCell(col).border = getAllBorders();
            }
            dataRow.height = 25;
            rowIndex++;

            // Photos section
            if (photoCount > 0) {
                // Label row: "清洗前照片:"
                const labelRow = sheet.getRow(rowIndex);
                sheet.mergeCells(`A${rowIndex}:G${rowIndex}`);
                const labelCell = labelRow.getCell(1);
                labelCell.value = `清洗前照片:`;
                labelCell.font = {
                    bold: true,
                    size: 11
                };
                labelCell.alignment = {
                    vertical: 'top',
                    horizontal: 'left',
                    indent: 1
                };
                labelCell.border = getAllBorders();
                labelRow.height = 20;
                rowIndex++;

                // Photo rows - increased height for images
                const photosPerRow = 2; // 2 photos per row
                for (let photoIdx = 0; photoIdx < item.specs.photoBefore.length; photoIdx += photosPerRow) {
                    const photoRowStart = rowIndex;

                    // Create a tall row for photos
                    sheet.mergeCells(`A${rowIndex}:G${rowIndex + 2}`); // Span 3 rows for height
                    const photoCell = sheet.getCell(`A${rowIndex}`);
                    photoCell.border = getAllBorders();

                    // Set row heights
                    for (let r = 0; r < 3; r++) {
                        sheet.getRow(rowIndex + r).height = 80;
                    }

                    // Download and add images side by side
                    for (let i = 0; i < photosPerRow && (photoIdx + i) < item.specs.photoBefore.length; i++) {
                        const photoUrl = item.specs.photoBefore[photoIdx + i];

                        try {
                            const imageBuffer = await downloadImage(photoUrl);

                            if (imageBuffer) {
                                const imageId = workbook.addImage({
                                    buffer: imageBuffer,
                                    extension: 'jpeg',
                                });

                                // Position images side by side
                                const colOffset = i * 3.5; // Horizontal spacing
                                sheet.addImage(imageId, {
                                    tl: {
                                        col: colOffset,
                                        row: photoRowStart - 1
                                    },
                                    ext: {
                                        width: 250,
                                        height: 180
                                    }
                                });
                            }
                        } catch (error) {
                            console.error('图片下载失败:', photoUrl, error);
                        }
                    }

                    rowIndex += 3; // Move to next photo row
                }
            }
        }
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

// Helper function to get all borders
function getAllBorders() {
    return {
        top: {
            style: 'thin',
            color: {
                argb: 'FF000000'
            }
        },
        left: {
            style: 'thin',
            color: {
                argb: 'FF000000'
            }
        },
        bottom: {
            style: 'thin',
            color: {
                argb: 'FF000000'
            }
        },
        right: {
            style: 'thin',
            color: {
                argb: 'FF000000'
            }
        }
    };
}

// Helper function to add data row with borders
function addBorderedDataRow(sheet, rowIndex, labelCol, labelText, valueCol, valueText) {
    const row = sheet.getRow(rowIndex);

    // Set label
    const labelCell = sheet.getCell(`${labelCol}${rowIndex}`);
    labelCell.value = labelText;
    labelCell.font = {
        bold: true
    };
    labelCell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
        indent: 1
    };
    labelCell.border = getAllBorders();

    // Set value (merge if needed)
    if (valueCol.includes(':')) {
        sheet.mergeCells(`${valueCol.split(':')[0]}${rowIndex}:${valueCol.split(':')[1]}${rowIndex}`);
    }
    const valueCell = sheet.getCell(`${valueCol.split(':')[0]}${rowIndex}`);
    valueCell.value = valueText;
    valueCell.alignment = {
        vertical: 'middle',
        wrapText: true
    };
    valueCell.border = getAllBorders();

    row.height = 25;
    return row;
}

async function generateConstructionReport(record) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('清洗报告');

    sheet.columns = [{
            width: 20
        },
        {
            width: 40
        }
    ];

    let rowIndex = 1;

    // Title
    sheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
    const titleCell = sheet.getCell(`A${rowIndex}`);
    titleCell.value = '清洗工作报告';
    titleCell.font = {
        size: 18,
        bold: true
    };
    titleCell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
            argb: 'FFFF9500'
        }
    };
    titleCell.font = {
        ...titleCell.font,
        color: {
            argb: 'FFFFFFFF'
        }
    };
    sheet.getRow(rowIndex).height = 30;
    rowIndex += 2;

    // Basic Info
    addSectionHeader(sheet, rowIndex, '基本信息');
    rowIndex++;

    addDataRow(sheet, rowIndex++, '施工人员', record.workerName || '-');
    addDataRow(sheet, rowIndex++, '施工单位', record.workerCompany || '-');

    const cleaningDate = record.cleaningDate ? new Date(record.cleaningDate).toLocaleString('zh-CN') : '-';
    addDataRow(sheet, rowIndex++, '清洗日期', cleaningDate);
    rowIndex++;

    // Cleaning Items
    if (record.selectedCleaningItems && record.selectedCleaningItems.length > 0) {
        addSectionHeader(sheet, rowIndex, '清洗项目');
        rowIndex++;

        record.selectedCleaningItems.forEach((item, index) => {
            addDataRow(sheet, rowIndex++, `项目 ${index + 1}`, item.label || '-');

            // Sub-options
            const subOptions = record.selectedSubOptions?.[item.id] || [];
            if (subOptions.length > 0) {
                addDataRow(sheet, rowIndex++, '  具体部位', subOptions.join(', '));
            }

            // Notes
            const notes = record.sideNotes?.[item.id];
            if (notes) {
                addDataRow(sheet, rowIndex++, '  备注', notes);
            }
        });
        rowIndex++;
    }

    // Environment Notes
    if (record.environmentNotes) {
        addSectionHeader(sheet, rowIndex, '环境变更记录');
        rowIndex++;
        addDataRow(sheet, rowIndex++, '记录', record.environmentNotes);
        rowIndex++;
    }

    // Statistics
    addSectionHeader(sheet, rowIndex, '照片统计');
    rowIndex++;

    let beforeCount = 0;
    let afterCount = 0;

    if (record.detailedBeforePhotos) {
        Object.values(record.detailedBeforePhotos).forEach(subObj => {
            Object.values(subObj).forEach(photos => {
                beforeCount += photos.length;
            });
        });
    }

    if (record.detailedAfterPhotos) {
        Object.values(record.detailedAfterPhotos).forEach(subObj => {
            Object.values(subObj).forEach(photos => {
                afterCount += photos.length;
            });
        });
    }

    addDataRow(sheet, rowIndex++, '清洗前照片', `${beforeCount} 张`);
    addDataRow(sheet, rowIndex++, '清洗后照片', `${afterCount} 张`);
    addDataRow(sheet, rowIndex++, '工作照片', `${record.workPhotos?.length || 0} 张`);

    // Add borders
    sheet.eachRow((row) => {
        row.eachCell((cell) => {
            if (!cell.border) {
                cell.border = {
                    top: {
                        style: 'thin'
                    },
                    left: {
                        style: 'thin'
                    },
                    bottom: {
                        style: 'thin'
                    },
                    right: {
                        style: 'thin'
                    }
                };
            }
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

async function generateBusinessReport(record) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('商户信息');

    sheet.columns = [{
            width: 20
        },
        {
            width: 40
        }
    ];

    let rowIndex = 1;

    // Title
    sheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
    const titleCell = sheet.getCell(`A${rowIndex}`);
    titleCell.value = '商户信息报告';
    titleCell.font = {
        size: 18,
        bold: true
    };
    titleCell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };
    titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
            argb: 'FF34C759'
        }
    };
    titleCell.font = {
        ...titleCell.font,
        color: {
            argb: 'FFFFFFFF'
        }
    };
    sheet.getRow(rowIndex).height = 30;
    rowIndex += 2;

    // Basic Info
    addSectionHeader(sheet, rowIndex, '基本信息');
    rowIndex++;

    addDataRow(sheet, rowIndex++, '商户名称', record.name || '-');
    addDataRow(sheet, rowIndex++, '位置', record.location || '-');
    addDataRow(sheet, rowIndex++, '外观描述', record.appearance || '-');
    addDataRow(sheet, rowIndex++, '商户类型', record.businessType || '-');

    if (record.rating) {
        addDataRow(sheet, rowIndex++, '评级', `${'⭐'.repeat(record.rating)} (${record.rating}/5)`);
    }

    rowIndex++;

    // Parking Info
    addSectionHeader(sheet, rowIndex, '停车信息');
    rowIndex++;

    addDataRow(sheet, rowIndex++, '停车场入口', record.parkingEntrance || '-');
    addDataRow(sheet, rowIndex++, '停车价格', record.parkingPrice || '-');
    addDataRow(sheet, rowIndex++, '停车反应', record.parkingReaction || '-');
    rowIndex++;

    // Customer Info
    if (record.customerInfo) {
        addSectionHeader(sheet, rowIndex, '商户详情');
        rowIndex++;

        const info = record.customerInfo;
        if (info.storefront) addDataRow(sheet, rowIndex++, '门脸', info.storefront);
        if (info.contactPerson) addDataRow(sheet, rowIndex++, '联系人', info.contactPerson);
        if (info.contactPhone) addDataRow(sheet, rowIndex++, '联系电话', info.contactPhone);
        if (info.contactPosition) addDataRow(sheet, rowIndex++, '职位', info.contactPosition);
        if (info.previousCleaning) addDataRow(sheet, rowIndex++, '清洗历史', info.previousCleaning);
        if (info.notes) addDataRow(sheet, rowIndex++, '备注', info.notes);
        rowIndex++;
    }

    // Reputation
    if (record.reputation) {
        addSectionHeader(sheet, rowIndex, '口碑评价');
        rowIndex++;
        addDataRow(sheet, rowIndex++, '评价', record.reputation);
    }

    // Add borders
    sheet.eachRow((row) => {
        row.eachCell((cell) => {
            if (!cell.border) {
                cell.border = {
                    top: {
                        style: 'thin'
                    },
                    left: {
                        style: 'thin'
                    },
                    bottom: {
                        style: 'thin'
                    },
                    right: {
                        style: 'thin'
                    }
                };
            }
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

async function downloadImage(url) {
    try {
        // Use uniCloud's built-in HTTP client
        const result = await uniCloud.httpclient.request(url, {
            method: 'GET',
            dataType: 'arraybuffer',
            timeout: 10000
        });

        if (result.status === 200) {
            return Buffer.from(result.data);
        } else {
            console.error('Failed to download image:', url, result.status);
            return null;
        }
    } catch (error) {
        console.error('Error downloading image:', url, error);
        return null;
    }
}

function addSectionHeader(sheet, rowIndex, title) {
    sheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
    const cell = sheet.getCell(`A${rowIndex}`);
    cell.value = title;
    cell.font = {
        size: 14,
        bold: true
    };
    cell.alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };
    cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
            argb: 'FFD9D9D9'
        }
    };
    sheet.getRow(rowIndex).height = 25;
}

function addDataRow(sheet, rowIndex, label, value) {
    const row = sheet.getRow(rowIndex);
    row.values = [label, value];
    row.getCell(1).font = {
        bold: true
    };
    row.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
            argb: 'FFF2F2F2'
        }
    };
    row.alignment = {
        vertical: 'middle',
        wrapText: true
    };
    row.height = 20;
}

async function generateTankanPDF(record) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4'
            });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // Register Chinese font
            const fontPath = path.join(__dirname, 'fonts', 'SourceHanSansSC-Regular.otf');
            doc.registerFont('ChineseFont', fontPath);

            // Title
            doc.fontSize(20).font('ChineseFont').text('踏勘报告', {
                align: 'center'
            });
            doc.moveDown(2);

            // Basic Info Section with border
            const basicInfoStartY = doc.y;
            doc.fontSize(14).font('ChineseFont').text('基本信息');
            doc.moveDown(0.5);
            doc.fontSize(11).font('ChineseFont');

            doc.text(`归属公司: ${record.guishu || '-'}`);
            doc.text(`踏勘人员: ${record.tankanyuan || '-'}`);
            doc.text(`项目名称: ${record.mingcheng || '-'}`);
            doc.text(`踏勘地点: ${record.didian || '-'}`);

            if (record.location) {
                doc.text(`GPS坐标: 纬度 ${record.location.latitude}, 经度 ${record.location.longitude}`);
            }

            const createDate = new Date(record.createTime);
            doc.text(`创建时间: ${createDate.toLocaleString('zh-CN')}`);
            doc.moveDown(0.5);

            // Draw border around Basic Info
            const basicInfoEndY = doc.y;
            doc.rect(40, basicInfoStartY - 10, doc.page.width - 80, basicInfoEndY - basicInfoStartY +
                    10)
                .stroke();
            doc.moveDown(1);

            // Environment Info Section with border
            const envStartY = doc.y;
            doc.fontSize(14).font('ChineseFont').text('环境信息');
            doc.moveDown(0.5);
            doc.fontSize(11).font('ChineseFont');

            doc.text(`停车场入口: ${record.environmentData?.parkingEntrance || '-'}`);
            doc.text(`电梯入口: ${record.environmentData?.elevatorEntrance || '-'}`);
            doc.text(`楼顶环境: ${record.environmentData?.rooftopEnvironment || '-'}`);
            doc.moveDown(0.5);

            // Draw border around Environment Info
            const envEndY = doc.y;
            doc.rect(40, envStartY - 10, doc.page.width - 80, envEndY - envStartY + 10)
                .stroke();
            doc.moveDown(1);

            // Cleaning Scope Section
            if (record.qingxifanwei && record.qingxifanwei.length > 0) {
                let cleaningStartY = doc.y;
                let needsNewBorder = false;

                doc.fontSize(14).font('ChineseFont').text('清洗范围详情');
                doc.moveDown(0.5);
                doc.fontSize(11).font('ChineseFont');

                for (let index = 0; index < record.qingxifanwei.length; index++) {
                    const item = record.qingxifanwei[index];

                    // Check if we need a new page
                    if (doc.y > 650) {
                        // Draw border before page break
                        const cleaningEndY = doc.y;
                        doc.rect(40, cleaningStartY - 10, doc.page.width - 80, cleaningEndY -
                                cleaningStartY + 10)
                            .stroke();
                        doc.addPage();
                        cleaningStartY = doc.y; // Reset start position for new page
                        needsNewBorder = true;
                    }

                    doc.text(`${index + 1}. 类型: ${item.type || '-'}`);
                    if (item.specs) {
                        doc.text(`   位置: ${item.specs.position || '-'}`);
                        doc.text(`   型号规格: ${item.specs.model || '-'}`);
                        doc.text(`   单位: ${item.specs.unit || '-'}, 数量: ${item.specs.quantity || '-'}`);
                        doc.text(`   频次: ${item.specs.frequency || '-'}`);
                        const photoCount = item.specs.photoBefore?.length || 0;
                        doc.text(`   照片数量: ${photoCount}张`);
                    }
                    doc.moveDown(0.5);

                    // Add photos if available
                    if (item.specs?.photoBefore && item.specs.photoBefore.length > 0) {
                        doc.fontSize(12).font('ChineseFont').text('清洗前照片:');
                        doc.moveDown(0.3);

                        for (let photoIdx = 0; photoIdx < item.specs.photoBefore.length; photoIdx++) {
                            const photoUrl = item.specs.photoBefore[photoIdx];

                            try {
                                const tempFileRes = await uniCloud.getTempFileURL({
                                    fileList: [photoUrl]
                                });

                                if (tempFileRes.fileList && tempFileRes.fileList.length > 0) {
                                    const tempUrl = tempFileRes.fileList[0].tempFileURL;
                                    const imageBuffer = await downloadImage(tempUrl);

                                    if (imageBuffer) {
                                        if (doc.y > 550) {
                                            // Draw border before adding new page
                                            const beforePageBreakY = doc.y;
                                            doc.rect(40, cleaningStartY - 10, doc.page.width - 80,
                                                    beforePageBreakY - cleaningStartY + 10)
                                                .stroke();
                                            doc.addPage();
                                            cleaningStartY = doc.y; // Reset for new page
                                        }

                                        doc.image(imageBuffer, {
                                            fit: [400, 300],
                                            align: 'center'
                                        });
                                        doc.moveDown(0.5);
                                    }
                                }
                            } catch (error) {
                                console.error('图片加载失败:', photoUrl, error);
                                doc.fontSize(10).font('ChineseFont').text(`[图片加载失败]`);
                                doc.moveDown(0.3);
                            }
                        }
                        doc.fontSize(11).font('ChineseFont'); // Reset font size
                        doc.moveDown(0.5);
                    }
                }

                doc.moveDown(0.5);
                // Draw final border around entire Cleaning Scope section
                // Now doc.y includes all the images
                const cleaningEndY = doc.y;
                doc.rect(40, cleaningStartY - 10, doc.page.width - 80, cleaningEndY - cleaningStartY +
                        10)
                    .stroke();
                doc.moveDown(1);
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

async function generateConstructionPDF(record) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4'
            });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // Register Chinese font
            const fontPath = path.join(__dirname, 'fonts', 'SourceHanSansSC-Regular.otf');
            doc.registerFont('ChineseFont', fontPath);

            // Title
            doc.fontSize(20).font('ChineseFont').text('清洗工作报告', {
                align: 'center'
            });
            doc.moveDown(2);

            // Basic Info Section with border
            const basicInfoStartY = doc.y;
            doc.fontSize(14).font('ChineseFont').text('基本信息');
            doc.moveDown(0.5);
            doc.fontSize(11).font('ChineseFont');

            doc.text(`施工人员: ${record.workerName || '-'}`);
            doc.text(`施工单位: ${record.workerCompany || '-'}`);

            const cleaningDate = record.cleaningDate ? new Date(record.cleaningDate).toLocaleString(
                'zh-CN') : '-';
            doc.text(`清洗日期: ${cleaningDate}`);
            doc.moveDown(0.5);

            // Draw border around Basic Info
            const basicInfoEndY = doc.y;
            doc.rect(40, basicInfoStartY - 10, doc.page.width - 80, basicInfoEndY - basicInfoStartY +
                    10)
                .stroke();
            doc.moveDown(1);

            // Cleaning Items Section
            if (record.selectedCleaningItems && record.selectedCleaningItems.length > 0) {
                const cleaningStartY = doc.y;
                doc.fontSize(14).font('ChineseFont').text('清洗项目');
                doc.moveDown(0.5);
                doc.fontSize(11).font('ChineseFont');

                for (let index = 0; index < record.selectedCleaningItems.length; index++) {
                    const item = record.selectedCleaningItems[index];

                    if (doc.y > 650) {
                        doc.addPage();
                    }

                    doc.text(`项目 ${index + 1}: ${item.label || '-'}`);

                    const subOptions = record.selectedSubOptions?.[item.id] || [];
                    if (subOptions.length > 0) {
                        doc.text(`  具体部位: ${subOptions.join(', ')}`);
                    }

                    const notes = record.sideNotes?.[item.id];
                    if (notes) {
                        doc.text(`  备注: ${notes}`);
                    }

                    doc.moveDown(0.5);

                    // Add before photos
                    const beforePhotos = record.detailedBeforePhotos?.[item.id];
                    if (beforePhotos) {
                        doc.fontSize(12).font('ChineseFont').text('清洗前照片:');
                        doc.moveDown(0.3);

                        for (const subOption in beforePhotos) {
                            const photos = beforePhotos[subOption];
                            if (photos && photos.length > 0) {
                                for (let photoIdx = 0; photoIdx < photos.length; photoIdx++) {
                                    const photoUrl = photos[photoIdx];

                                    try {
                                        const tempFileRes = await uniCloud.getTempFileURL({
                                            fileList: [photoUrl]
                                        });

                                        if (tempFileRes.fileList && tempFileRes.fileList.length > 0) {
                                            const tempUrl = tempFileRes.fileList[0].tempFileURL;
                                            const imageBuffer = await downloadImage(tempUrl);

                                            if (imageBuffer) {
                                                if (doc.y > 550) {
                                                    doc.addPage();
                                                }

                                                doc.image(imageBuffer, {
                                                    fit: [400, 300],
                                                    align: 'center'
                                                });
                                                doc.moveDown(0.5);
                                            }
                                        }
                                    } catch (error) {
                                        console.error('图片加载失败:', photoUrl, error);
                                    }
                                }
                            }
                        }
                    }

                    // Add after photos
                    const afterPhotos = record.detailedAfterPhotos?.[item.id];
                    if (afterPhotos) {
                        doc.fontSize(12).font('ChineseFont').text('清洗后照片:');
                        doc.moveDown(0.3);

                        for (const subOption in afterPhotos) {
                            const photos = afterPhotos[subOption];
                            if (photos && photos.length > 0) {
                                for (let photoIdx = 0; photoIdx < photos.length; photoIdx++) {
                                    const photoUrl = photos[photoIdx];

                                    try {
                                        const tempFileRes = await uniCloud.getTempFileURL({
                                            fileList: [photoUrl]
                                        });

                                        if (tempFileRes.fileList && tempFileRes.fileList.length > 0) {
                                            const tempUrl = tempFileRes.fileList[0].tempFileURL;
                                            const imageBuffer = await downloadImage(tempUrl);

                                            if (imageBuffer) {
                                                if (doc.y > 550) {
                                                    doc.addPage();
                                                }

                                                doc.image(imageBuffer, {
                                                    fit: [400, 300],
                                                    align: 'center'
                                                });
                                                doc.moveDown(0.5);
                                            }
                                        }
                                    } catch (error) {
                                        console.error('图片加载失败:', photoUrl, error);
                                    }
                                }
                            }
                        }
                    }

                    doc.moveDown(1);
                }

                doc.moveDown(0.5);
                // Draw border around Cleaning Items section
                const cleaningEndY = doc.y;
                doc.rect(40, cleaningStartY - 10, doc.page.width - 80, cleaningEndY - cleaningStartY +
                        10)
                    .stroke();
                doc.moveDown(1);
            }

            // Work photos section with border
            if (record.workPhotos && record.workPhotos.length > 0) {
                const workPhotosStartY = doc.y;
                doc.fontSize(14).font('ChineseFont').text('工作照片');
                doc.moveDown(0.5);

                for (let photoIdx = 0; photoIdx < record.workPhotos.length; photoIdx++) {
                    const photoUrl = record.workPhotos[photoIdx];

                    try {
                        const tempFileRes = await uniCloud.getTempFileURL({
                            fileList: [photoUrl]
                        });

                        if (tempFileRes.fileList && tempFileRes.fileList.length > 0) {
                            const tempUrl = tempFileRes.fileList[0].tempFileURL;
                            const imageBuffer = await downloadImage(tempUrl);

                            if (imageBuffer) {
                                if (doc.y > 550) {
                                    doc.addPage();
                                }

                                doc.image(imageBuffer, {
                                    fit: [400, 300],
                                    align: 'center'
                                });
                                doc.moveDown(0.5);
                            }
                        }
                    } catch (error) {
                        console.error('图片加载失败:', photoUrl, error);
                    }
                }

                doc.moveDown(0.5);
                // Draw border around Work Photos section
                const workPhotosEndY = doc.y;
                doc.rect(40, workPhotosStartY - 10, doc.page.width - 80, workPhotosEndY -
                        workPhotosStartY + 10)
                    .stroke();
                doc.moveDown(1);
            }

            // Environment Notes with border
            if (record.environmentNotes) {
                if (doc.y > 650) {
                    doc.addPage();
                }
                const envNotesStartY = doc.y;
                doc.fontSize(14).font('ChineseFont').text('环境变更记录');
                doc.moveDown(0.5);
                doc.fontSize(11).font('ChineseFont');
                doc.text(record.environmentNotes);
                doc.moveDown(0.5);

                // Draw border around Environment Notes
                const envNotesEndY = doc.y;
                doc.rect(40, envNotesStartY - 10, doc.page.width - 80, envNotesEndY - envNotesStartY +
                        10)
                    .stroke();
                doc.moveDown(1);
            }

            // Photo Statistics with border
            const statsStartY = doc.y;
            doc.fontSize(14).font('ChineseFont').text('照片统计');
            doc.moveDown(0.5);
            doc.fontSize(11).font('ChineseFont');

            let beforeCount = 0;
            let afterCount = 0;

            if (record.detailedBeforePhotos) {
                Object.values(record.detailedBeforePhotos).forEach(subObj => {
                    Object.values(subObj).forEach(photos => {
                        beforeCount += photos.length;
                    });
                });
            }

            if (record.detailedAfterPhotos) {
                Object.values(record.detailedAfterPhotos).forEach(subObj => {
                    Object.values(subObj).forEach(photos => {
                        afterCount += photos.length;
                    });
                });
            }

            doc.text(`清洗前照片: ${beforeCount}张`);
            doc.text(`清洗后照片: ${afterCount}张`);
            doc.text(`工作照片: ${record.workPhotos?.length || 0}张`);
            doc.moveDown(0.5);

            // Draw border around Statistics
            const statsEndY = doc.y;
            doc.rect(40, statsStartY - 10, doc.page.width - 80, statsEndY - statsStartY + 10)
                .stroke();

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

async function generateBusinessPDF(record) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                margin: 50,
                size: 'A4'
            });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // Register Chinese font
            const fontPath = path.join(__dirname, 'fonts', 'SourceHanSansSC-Regular.otf');
            doc.registerFont('ChineseFont', fontPath);

            // Title
            doc.fontSize(20).font('ChineseFont').text('商户信息报告', {
                align: 'center'
            });
            doc.moveDown(2);

            // Basic Info Section with border
            const basicInfoStartY = doc.y;
            doc.fontSize(14).font('ChineseFont').text('基本信息');
            doc.moveDown(0.5);
            doc.fontSize(11).font('ChineseFont');

            doc.text(`商户名称: ${record.name || '-'}`);
            doc.text(`位置: ${record.location || '-'}`);
            doc.text(`外观描述: ${record.appearance || '-'}`);
            doc.text(`商户类型: ${record.businessType || '-'}`);

            if (record.rating) {
                doc.text(`评级: ${'★'.repeat(record.rating)} (${record.rating}/5)`);
            }
            doc.moveDown(0.5);

            // Draw border around Basic Info
            const basicInfoEndY = doc.y;
            doc.rect(40, basicInfoStartY - 10, doc.page.width - 80, basicInfoEndY - basicInfoStartY +
                    10)
                .stroke();
            doc.moveDown(1);

            // Parking Info Section with border
            const parkingStartY = doc.y;
            doc.fontSize(14).font('ChineseFont').text('停车信息');
            doc.moveDown(0.5);
            doc.fontSize(11).font('ChineseFont');

            doc.text(`停车场入口: ${record.parkingEntrance || '-'}`);
            doc.text(`停车价格: ${record.parkingPrice || '-'}`);
            doc.text(`停车反应: ${record.parkingReaction || '-'}`);
            doc.moveDown(0.5);

            // Draw border around Parking Info
            const parkingEndY = doc.y;
            doc.rect(40, parkingStartY - 10, doc.page.width - 80, parkingEndY - parkingStartY + 10)
                .stroke();
            doc.moveDown(1);

            // Customer Info Section with border
            if (record.customerInfo) {
                const customerStartY = doc.y;
                doc.fontSize(14).font('ChineseFont').text('商户详情');
                doc.moveDown(0.5);
                doc.fontSize(11).font('ChineseFont');

                const info = record.customerInfo;
                if (info.storefront) doc.text(`门脸: ${info.storefront}`);
                if (info.contactPerson) doc.text(`联系人: ${info.contactPerson}`);
                if (info.contactPhone) doc.text(`联系电话: ${info.contactPhone}`);
                if (info.contactPosition) doc.text(`职位: ${info.contactPosition}`);
                if (info.previousCleaning) doc.text(`清洗历史: ${info.previousCleaning}`);
                if (info.notes) doc.text(`备注: ${info.notes}`);
                doc.moveDown(0.5);

                // Draw border around Customer Info
                const customerEndY = doc.y;
                doc.rect(40, customerStartY - 10, doc.page.width - 80, customerEndY - customerStartY +
                        10)
                    .stroke();
                doc.moveDown(1);
            }

            // Reputation Section with border
            if (record.reputation) {
                const reputationStartY = doc.y;
                doc.fontSize(14).font('ChineseFont').text('口碑评价');
                doc.moveDown(0.5);
                doc.fontSize(11).font('ChineseFont');
                doc.text(record.reputation);
                doc.moveDown(0.5);

                // Draw border around Reputation
                const reputationEndY = doc.y;
                doc.rect(40, reputationStartY - 10, doc.page.width - 80, reputationEndY -
                        reputationStartY + 10)
                    .stroke();
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

async function generateTankanWord(record) {
    const {
        ImageRun
    } = require('docx');
    const sections = [];

    // Title
    sections.push(
        new Paragraph({
            text: '踏勘报告',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: {
                after: 400
            }
        })
    );

    // Basic Info Section
    sections.push(
        new Paragraph({
            text: '基本信息',
            heading: HeadingLevel.HEADING_1,
            spacing: {
                before: 200,
                after: 200
            },
            border: {
                top: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                },
                bottom: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                },
                left: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                },
                right: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                }
            }
        })
    );

    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '归属公司: ',
                    bold: true
                }),
                new TextRun(record.guishu || '-')
            ],
            spacing: {
                after: 100
            }
        })
    );

    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '踏勘人员: ',
                    bold: true
                }),
                new TextRun(record.tankanyuan || '-')
            ],
            spacing: {
                after: 100
            }
        })
    );

    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '项目名称: ',
                    bold: true
                }),
                new TextRun(record.mingcheng || '-')
            ],
            spacing: {
                after: 100
            }
        })
    );

    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '踏勘地点: ',
                    bold: true
                }),
                new TextRun(record.didian || '-')
            ],
            spacing: {
                after: 100
            }
        })
    );

    if (record.location) {
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'GPS坐标: ',
                        bold: true
                    }),
                    new TextRun(`纬度 ${record.location.latitude}, 经度 ${record.location.longitude}`)
                ],
                spacing: {
                    after: 100
                }
            })
        );
    }

    const createDate = new Date(record.createTime);
    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '创建时间: ',
                    bold: true
                }),
                new TextRun(createDate.toLocaleString('zh-CN'))
            ],
            spacing: {
                after: 300
            }
        })
    );

    // Environment Info Section
    sections.push(
        new Paragraph({
            text: '环境信息',
            heading: HeadingLevel.HEADING_1,
            spacing: {
                before: 200,
                after: 200
            },
            border: {
                top: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                },
                bottom: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                },
                left: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                },
                right: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                }
            }
        })
    );

    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '停车场入口: ',
                    bold: true
                }),
                new TextRun(record.environmentData?.parkingEntrance || '-')
            ],
            spacing: {
                after: 100
            }
        })
    );

    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '电梯入口: ',
                    bold: true
                }),
                new TextRun(record.environmentData?.elevatorEntrance || '-')
            ],
            spacing: {
                after: 100
            }
        })
    );

    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '楼顶环境: ',
                    bold: true
                }),
                new TextRun(record.environmentData?.rooftopEnvironment || '-')
            ],
            spacing: {
                after: 300
            }
        })
    );

    // Cleaning Scope Section with images
    if (record.qingxifanwei && record.qingxifanwei.length > 0) {
        sections.push(
            new Paragraph({
                text: '清洗范围详情',
                heading: HeadingLevel.HEADING_1,
                spacing: {
                    before: 200,
                    after: 200
                },
                border: {
                    top: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    },
                    bottom: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    },
                    left: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    },
                    right: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    }
                }
            })
        );

        for (let index = 0; index < record.qingxifanwei.length; index++) {
            const item = record.qingxifanwei[index];

            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${index + 1}. 类型: `,
                            bold: true
                        }),
                        new TextRun(item.type || '-')
                    ],
                    spacing: {
                        after: 100
                    }
                })
            );

            if (item.specs) {
                sections.push(
                    new Paragraph({
                        text: `   位置: ${item.specs.position || '-'}`,
                        spacing: {
                            after: 50
                        }
                    })
                );

                sections.push(
                    new Paragraph({
                        text: `   型号规格: ${item.specs.model || '-'}`,
                        spacing: {
                            after: 50
                        }
                    })
                );

                sections.push(
                    new Paragraph({
                        text: `   单位: ${item.specs.unit || '-'}, 数量: ${item.specs.quantity || '-'}`,
                        spacing: {
                            after: 50
                        }
                    })
                );

                sections.push(
                    new Paragraph({
                        text: `   频次: ${item.specs.frequency || '-'}`,
                        spacing: {
                            after: 50
                        }
                    })
                );

                const photoCount = item.specs.photoBefore?.length || 0;
                sections.push(
                    new Paragraph({
                        text: `   照片数量: ${photoCount}张`,
                        spacing: {
                            after: 100
                        }
                    })
                );

                // Add photos if available
                if (item.specs.photoBefore && item.specs.photoBefore.length > 0) {
                    sections.push(
                        new Paragraph({
                            text: '清洗前照片:',
                            spacing: {
                                after: 100
                            }
                        })
                    );

                    for (let photoIdx = 0; photoIdx < item.specs.photoBefore.length; photoIdx++) {
                        const photoUrl = item.specs.photoBefore[photoIdx];

                        try {
                            // Get temp URL for cloud storage file
                            const tempFileRes = await uniCloud.getTempFileURL({
                                fileList: [photoUrl]
                            });

                            if (tempFileRes.fileList && tempFileRes.fileList.length > 0) {
                                const tempUrl = tempFileRes.fileList[0].tempFileURL;
                                const imageBuffer = await downloadImage(tempUrl);

                                if (imageBuffer) {
                                    sections.push(
                                        new Paragraph({
                                            children: [
                                                new ImageRun({
                                                    data: imageBuffer,
                                                    transformation: {
                                                        width: 400,
                                                        height: 300
                                                    }
                                                })
                                            ],
                                            spacing: {
                                                after: 200
                                            }
                                        })
                                    );
                                }
                            }
                        } catch (error) {
                            console.error('图片加载失败:', photoUrl, error);
                            sections.push(
                                new Paragraph({
                                    text: '[图片加载失败]',
                                    spacing: {
                                        after: 100
                                    }
                                })
                            );
                        }
                    }
                }
            }

            sections.push(
                new Paragraph({
                    text: '',
                    spacing: {
                        after: 200
                    }
                })
            );
        }
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children: sections
        }]
    });

    return await Packer.toBuffer(doc);
}

async function generateConstructionWord(record) {
    const {
        ImageRun
    } = require('docx');
    const sections = [];

    // Title
    sections.push(
        new Paragraph({
            text: '清洗工作报告',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: {
                after: 400
            }
        })
    );

    // Basic Info Section
    sections.push(
        new Paragraph({
            text: '基本信息',
            heading: HeadingLevel.HEADING_1,
            spacing: {
                before: 200,
                after: 200
            },
            border: {
                top: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                },
                bottom: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                },
                left: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                },
                right: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                }
            }
        })
    );

    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '施工人员: ',
                    bold: true
                }),
                new TextRun(record.workerName || '-')
            ],
            spacing: {
                after: 100
            }
        })
    );

    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '施工单位: ',
                    bold: true
                }),
                new TextRun(record.workerCompany || '-')
            ],
            spacing: {
                after: 100
            }
        })
    );

    const cleaningDate = record.cleaningDate ? new Date(record.cleaningDate).toLocaleString('zh-CN') : '-';
    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '清洗日期: ',
                    bold: true
                }),
                new TextRun(cleaningDate)
            ],
            spacing: {
                after: 300
            }
        })
    );

    // Cleaning Items Section with images
    if (record.selectedCleaningItems && record.selectedCleaningItems.length > 0) {
        sections.push(
            new Paragraph({
                text: '清洗项目',
                heading: HeadingLevel.HEADING_1,
                spacing: {
                    before: 200,
                    after: 200
                },
                border: {
                    top: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    },
                    bottom: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    },
                    left: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    },
                    right: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    }
                }
            })
        );

        for (let index = 0; index < record.selectedCleaningItems.length; index++) {
            const item = record.selectedCleaningItems[index];

            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `项目 ${index + 1}: `,
                            bold: true
                        }),
                        new TextRun(item.label || '-')
                    ],
                    spacing: {
                        after: 100
                    }
                })
            );

            const subOptions = record.selectedSubOptions?.[item.id] || [];
            if (subOptions.length > 0) {
                sections.push(
                    new Paragraph({
                        text: `  具体部位: ${subOptions.join(', ')}`,
                        spacing: {
                            after: 50
                        }
                    })
                );
            }

            const notes = record.sideNotes?.[item.id];
            if (notes) {
                sections.push(
                    new Paragraph({
                        text: `  备注: ${notes}`,
                        spacing: {
                            after: 100
                        }
                    })
                );
            }

            // Add before photos
            const beforePhotos = record.detailedBeforePhotos?.[item.id];
            if (beforePhotos) {
                sections.push(
                    new Paragraph({
                        text: '清洗前照片:',
                        spacing: {
                            after: 100
                        }
                    })
                );

                for (const subOption in beforePhotos) {
                    const photos = beforePhotos[subOption];
                    if (photos && photos.length > 0) {
                        for (let photoIdx = 0; photoIdx < photos.length; photoIdx++) {
                            const photoUrl = photos[photoIdx];

                            try {
                                const tempFileRes = await uniCloud.getTempFileURL({
                                    fileList: [photoUrl]
                                });

                                if (tempFileRes.fileList && tempFileRes.fileList.length > 0) {
                                    const tempUrl = tempFileRes.fileList[0].tempFileURL;
                                    const imageBuffer = await downloadImage(tempUrl);

                                    if (imageBuffer) {
                                        sections.push(
                                            new Paragraph({
                                                children: [
                                                    new ImageRun({
                                                        data: imageBuffer,
                                                        transformation: {
                                                            width: 400,
                                                            height: 300
                                                        }
                                                    })
                                                ],
                                                spacing: {
                                                    after: 200
                                                }
                                            })
                                        );
                                    }
                                }
                            } catch (error) {
                                console.error('图片加载失败:', photoUrl, error);
                            }
                        }
                    }
                }
            }

            // Add after photos
            const afterPhotos = record.detailedAfterPhotos?.[item.id];
            if (afterPhotos) {
                sections.push(
                    new Paragraph({
                        text: '清洗后照片:',
                        spacing: {
                            after: 100
                        }
                    })
                );

                for (const subOption in afterPhotos) {
                    const photos = afterPhotos[subOption];
                    if (photos && photos.length > 0) {
                        for (let photoIdx = 0; photoIdx < photos.length; photoIdx++) {
                            const photoUrl = photos[photoIdx];

                            try {
                                const tempFileRes = await uniCloud.getTempFileURL({
                                    fileList: [photoUrl]
                                });

                                if (tempFileRes.fileList && tempFileRes.fileList.length > 0) {
                                    const tempUrl = tempFileRes.fileList[0].tempFileURL;
                                    const imageBuffer = await downloadImage(tempUrl);

                                    if (imageBuffer) {
                                        sections.push(
                                            new Paragraph({
                                                children: [
                                                    new ImageRun({
                                                        data: imageBuffer,
                                                        transformation: {
                                                            width: 400,
                                                            height: 300
                                                        }
                                                    })
                                                ],
                                                spacing: {
                                                    after: 200
                                                }
                                            })
                                        );
                                    }
                                }
                            } catch (error) {
                                console.error('图片加载失败:', photoUrl, error);
                            }
                        }
                    }
                }
            }

            sections.push(
                new Paragraph({
                    text: '',
                    spacing: {
                        after: 200
                    }
                })
            );
        }
    }

    // Work photos
    if (record.workPhotos && record.workPhotos.length > 0) {
        sections.push(
            new Paragraph({
                text: '工作照片',
                heading: HeadingLevel.HEADING_1,
                spacing: {
                    before: 200,
                    after: 200
                },
                border: {
                    top: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    },
                    bottom: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    },
                    left: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    },
                    right: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    }
                }
            })
        );

        for (let photoIdx = 0; photoIdx < record.workPhotos.length; photoIdx++) {
            const photoUrl = record.workPhotos[photoIdx];

            try {
                const tempFileRes = await uniCloud.getTempFileURL({
                    fileList: [photoUrl]
                });

                if (tempFileRes.fileList && tempFileRes.fileList.length > 0) {
                    const tempUrl = tempFileRes.fileList[0].tempFileURL;
                    const imageBuffer = await downloadImage(tempUrl);

                    if (imageBuffer) {
                        sections.push(
                            new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: imageBuffer,
                                        transformation: {
                                            width: 400,
                                            height: 300
                                        }
                                    })
                                ],
                                spacing: {
                                    after: 200
                                }
                            })
                        );
                    }
                }
            } catch (error) {
                console.error('图片加载失败:', photoUrl, error);
            }
        }
    }

    // Environment Notes
    if (record.environmentNotes) {
        sections.push(
            new Paragraph({
                text: '环境变更记录',
                heading: HeadingLevel.HEADING_1,
                spacing: {
                    before: 200,
                    after: 200
                },
                border: {
                    top: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    },
                    bottom: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    },
                    left: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    },
                    right: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    }
                }
            })
        );

        sections.push(
            new Paragraph({
                text: record.environmentNotes,
                spacing: {
                    after: 300
                }
            })
        );
    }

    // Photo Statistics
    sections.push(
        new Paragraph({
            text: '照片统计',
            heading: HeadingLevel.HEADING_1,
            spacing: {
                before: 200,
                after: 200
            },
            border: {
                top: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                },
                bottom: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                },
                left: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                },
                right: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                }
            }
        })
    );

    let beforeCount = 0;
    let afterCount = 0;

    if (record.detailedBeforePhotos) {
        Object.values(record.detailedBeforePhotos).forEach(subObj => {
            Object.values(subObj).forEach(photos => {
                beforeCount += photos.length;
            });
        });
    }

    if (record.detailedAfterPhotos) {
        Object.values(record.detailedAfterPhotos).forEach(subObj => {
            Object.values(subObj).forEach(photos => {
                afterCount += photos.length;
            });
        });
    }

    sections.push(
        new Paragraph({
            text: `清洗前照片: ${beforeCount}张`,
            spacing: {
                after: 100
            }
        })
    );

    sections.push(
        new Paragraph({
            text: `清洗后照片: ${afterCount}张`,
            spacing: {
                after: 100
            }
        })
    );

    sections.push(
        new Paragraph({
            text: `工作照片: ${record.workPhotos?.length || 0}张`,
            spacing: {
                after: 100
            }
        })
    );

    const doc = new Document({
        sections: [{
            properties: {},
            children: sections
        }]
    });

    return await Packer.toBuffer(doc);
}

async function generateBusinessWord(record) {
    const sections = [];

    // Title
    sections.push(
        new Paragraph({
            text: '商户信息报告',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: {
                after: 400
            }
        })
    );

    // Basic Info Section
    sections.push(
        new Paragraph({
            text: '基本信息',
            heading: HeadingLevel.HEADING_1,
            spacing: {
                before: 200,
                after: 200
            },
            border: {
                top: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                },
                bottom: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                },
                left: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                },
                right: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                }
            }
        })
    );

    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '商户名称: ',
                    bold: true
                }),
                new TextRun(record.name || '-')
            ],
            spacing: {
                after: 100
            }
        })
    );

    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '位置: ',
                    bold: true
                }),
                new TextRun(record.location || '-')
            ],
            spacing: {
                after: 100
            }
        })
    );

    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '外观描述: ',
                    bold: true
                }),
                new TextRun(record.appearance || '-')
            ],
            spacing: {
                after: 100
            }
        })
    );

    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '商户类型: ',
                    bold: true
                }),
                new TextRun(record.businessType || '-')
            ],
            spacing: {
                after: 100
            }
        })
    );

    if (record.rating) {
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: '评级: ',
                        bold: true
                    }),
                    new TextRun(`${'★'.repeat(record.rating)} (${record.rating}/5)`)
                ],
                spacing: {
                    after: 300
                }
            })
        );
    }

    // Parking Info Section
    sections.push(
        new Paragraph({
            text: '停车信息',
            heading: HeadingLevel.HEADING_1,
            spacing: {
                before: 200,
                after: 200
            },
            border: {
                top: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                },
                bottom: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                },
                left: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                },
                right: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: "000000"
                }
            }
        })
    );

    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '停车场入口: ',
                    bold: true
                }),
                new TextRun(record.parkingEntrance || '-')
            ],
            spacing: {
                after: 100
            }
        })
    );

    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '停车价格: ',
                    bold: true
                }),
                new TextRun(record.parkingPrice || '-')
            ],
            spacing: {
                after: 100
            }
        })
    );

    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: '停车反应: ',
                    bold: true
                }),
                new TextRun(record.parkingReaction || '-')
            ],
            spacing: {
                after: 300
            }
        })
    );

    // Customer Info Section
    if (record.customerInfo) {
        sections.push(
            new Paragraph({
                text: '商户详情',
                heading: HeadingLevel.HEADING_1,
                spacing: {
                    before: 200,
                    after: 200
                },
                border: {
                    top: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    },
                    bottom: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    },
                    left: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    },
                    right: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    }
                }
            })
        );

        const info = record.customerInfo;
        if (info.storefront) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: '门脸: ',
                            bold: true
                        }),
                        new TextRun(info.storefront)
                    ],
                    spacing: {
                        after: 100
                    }
                })
            );
        }

        if (info.contactPerson) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: '联系人: ',
                            bold: true
                        }),
                        new TextRun(info.contactPerson)
                    ],
                    spacing: {
                        after: 100
                    }
                })
            );
        }

        if (info.contactPhone) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: '联系电话: ',
                            bold: true
                        }),
                        new TextRun(info.contactPhone)
                    ],
                    spacing: {
                        after: 100
                    }
                })
            );
        }

        if (info.contactPosition) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: '职位: ',
                            bold: true
                        }),
                        new TextRun(info.contactPosition)
                    ],
                    spacing: {
                        after: 100
                    }
                })
            );
        }

        if (info.previousCleaning) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: '清洗历史: ',
                            bold: true
                        }),
                        new TextRun(info.previousCleaning)
                    ],
                    spacing: {
                        after: 100
                    }
                })
            );
        }

        if (info.notes) {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: '备注: ',
                            bold: true
                        }),
                        new TextRun(info.notes)
                    ],
                    spacing: {
                        after: 100
                    }
                })
            );
        }
    }

    // Reputation Section
    if (record.reputation) {
        sections.push(
            new Paragraph({
                text: '口碑评价',
                heading: HeadingLevel.HEADING_1,
                spacing: {
                    before: 200,
                    after: 200
                },
                border: {
                    top: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    },
                    bottom: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    },
                    left: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    },
                    right: {
                        style: BorderStyle.SINGLE,
                        size: 6,
                        color: "000000"
                    }
                }
            })
        );

        sections.push(
            new Paragraph({
                text: record.reputation,
                spacing: {
                    after: 100
                }
            })
        );
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children: sections
        }]
    });

    return await Packer.toBuffer(doc);
}