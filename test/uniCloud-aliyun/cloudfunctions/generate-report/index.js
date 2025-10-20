'use strict';
const ExcelJS = require('exceljs');
const db = uniCloud.database();

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

        // Generate Excel based on type
        let buffer;
        if (recordType === 'tankan') {
            buffer = await generateTankanReport(record);
        } else if (recordType === 'construction') {
            buffer = await generateConstructionReport(record);
        } else if (recordType === 'business') {
            buffer = await generateBusinessReport(record);
        }

        // Upload to cloud storage
        const fileName = `${recordType}_report_${Date.now()}.xlsx`;
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