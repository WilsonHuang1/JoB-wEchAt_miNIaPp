Cloud Function List
1. ocr-recognition
Purpose: OCR text recognition from equipment label photo

2. smart-suggestions
Purpose: Generate intelligent suggestions based on historical data
Configuration:
Memory: 256MB
Timeout: 20 seconds
Runtime: Node.js 14

Dependencies: None (uses built-in uniCloud DB)
Input Parameters:
{
  userId: String,        // Required
  location: String,      // Required
  companyName: String,   // Optional
  suggestionType: String // Required - "environment" | "cleaning" | "business" | "all"
}

Processing Flow:
Parameter validation
Query historical data (last 6 months, limit 10)
Frequency analysis
Confidence calculation
Generate suggestions

Output Format:
// Success - Environment suggestions
{
  code: 200,
  message: "智能建议获取成功",
  data: {
    parkingEntrance: "地下停车场A入口",
    recommendedParking: "B2区靠近电梯",
    elevatorEntrance: "3号电梯",
    recommendedRoute: "从停车场直达3号电梯",
    confidence: "high"  // high | medium | low
  }
}

// No data
{
  code: 200,
  message: "暂无历史数据",
  data: null
}

3. generate-report
Purpose: Generate formatted reports (Excel/PDF/Word)
Configuration:
Memory: 1024MB (document generation needs more memory)
Timeout: 60 seconds
Runtime: Node.js 14

Dependencies:
{
  "exceljs": "^4.3.0",
  "docxtemplater": "^3.42.0",
  "pizzip": "^3.1.4",
  "pdfkit": "^0.13.0"
}

Input Parameters:
{
  recordId: String,    // Required - Record _id
  recordType: String,  // Required - "tankan" | "construction" | "business"
  format: String       // Required - "excel" | "pdf" | "word"
}

Processing Flow:

Parameter validation
Query database by recordId
Select template based on recordType and data
Generate document:

Excel: Create workbook, add worksheets, fill data, apply styles, add borders
PDF: (To be implemented)
Word: (To be implemented)


Upload to cloud storage
Return download URL

Output Format:
// Success
{
  code: 200,
  message: "报告生成成功",
  data: {
    fileID: "cloud://xxx.xlsx",
    fileName: "踏勘报告_测试项目_1234567890.xlsx",
    downloadUrl: "https://xxx.com/xxx.xlsx"
  }
}

// Failure
{
  code: 500,
  message: "报告生成失败: ...",
  error: "..."
}

Excel Report Structure:
[Title] - Merged cells, 18pt bold, centered
[Section: Basic Info] - 14pt bold, gray background
  Label | Value
  Label | Value
  ...
[Section: Environment Info] - 14pt bold, gray background
  Label | Value
  ...
[Section: Cleaning Scope] - 14pt bold, gray background
  Items list
[Section: Summary Data] - 14pt bold, gray background
  Statistics
[All cells have borders]