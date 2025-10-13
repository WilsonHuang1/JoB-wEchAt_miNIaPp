Intelligent Agent Layer (AI Features)
Feature 1: OCR Recognition (设备标签识别)
Purpose: Automatically recognize equipment labels from photos and auto-fill form fields

Feature 2: Smart Suggestions (智能推荐引擎)
Purpose: Provide intelligent auto-fill suggestions based on historical data
Technology:
Algorithm: Frequency analysis + Pattern matching
Data Source: Historical records database
Confidence Scoring: Based on sample size

Confidence Levels:
High: ≥10 records (recommended to apply directly)
Medium: 5-9 records (review before applying)
Low: 2-4 records (reference only)
Very Low: <2 records (don't show suggestions)

Implementation:
Cloud Function: smart-suggestions
Query Logic: Fuzzy match location (first 5 chars) + exact company match
Time Range: Recent 6 months
Limit: Top 10 records

Use Cases:
A. Environment Information Suggestions
// Query
Input: location = "北京市朝阳区建国路"
Query: Find records with didian containing "北京市朝阳区"
Time: Last 6 months
Limit: 10 records

// Analysis
parkingEntrance frequency:
- "地下停车场A入口" (7 times, 70%)
- "地下停车场B入口" (2 times, 20%)
- "地面停车场" (1 time, 10%)

Recommendation: "地下停车场A入口" (70% frequency)
Confidence: High (10 records)

B. Cleaning Scope Suggestions
// Query
Input: companyName = "XX物业管理公司"
Query: Find records with guishu = "XX物业管理公司"

// Analysis
横管: 8 times (80%)
竖管: 7 times (70%)
风机: 6 times (60%)
净化器: 5 times (50%)
厨房烟罩: 4 times (40%)

Display: Show frequency and allow one-click selection

C. Business Info Suggestions
// Query
Input: location area
Analysis: 
- Average rating in area: 4.2 stars
- Common parking reaction: "良好" (65%)
- Average parking price: ¥5/hour

Display: As reference information

Algorithm Functions:
// 1. Query Historical Data
function queryHistoricalData(location, companyName) {
  const locationPattern = location.substring(0, 5);
  
  return db.collection('tankan_records')
    .where({
      didian: db.RegExp({ regexp: locationPattern, options: 'i' })
    })
    .where({
      createTime: db.command.gt(Date.now() - 6*30*24*60*60*1000)
    })
    .orderBy('createTime', 'desc')
    .limit(10);
}

// 2. Calculate Frequency
function calculateFrequency(records, field) {
  const counts = {};
  records.forEach(record => {
    const value = record[field];
    if (value) {
      counts[value] = (counts[value] || 0) + 1;
    }
  });
  
  return Object.entries(counts)
    .map(([value, count]) => ({
      value,
      count,
      percentage: Math.round(count / records.length * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

// 3. Calculate Confidence
function calculateConfidence(count) {
  if (count >= 10) return 'high';
  if (count >= 5) return 'medium';
  if (count >= 2) return 'low';
  return 'very_low';
}

Feature 3: Smart Data Validation (智能数据验证)
Purpose: Real-time anomaly detection to prevent erroneous data entry
Technology:
Algorithm: Rule engine + Statistical analysis
Trigger: Real-time validation + Pre-submit validation
Response: Instant feedback + Block/Warn

Validation Types:
A. Range Validation
const rangeRules = {
  price: { min: 0, max: 100000 },      // Warning if > 100k
  pipeLength: { min: 0, max: 1000 },   // Warning if > 1000m
  fanCount: { min: 0, max: 50 },       // Warning if > 50 units
  rating: { min: 1, max: 5 },          // Error if outside 1-5
  quantity: { min: 0 }                 // Error if negative
};

// Example
Input: parkingPrice = 150000
Validation: price > 100000
Result: ⚠️ Warning
Message: "停车价格 ¥150,000 异常高（超过常规范围），是否确认继续？"
Action: User can confirm to continue


Oil Fume Cleaning Management System - Architecture Documentation
Project Overview

System Name: 油烟清洗管理系统 (Oil Fume Cleaning Management System)
Purpose: Field inspection, cleaning work tracking, and business management for oil fume cleaning services
Platform: uni-app (Multi-platform: H5/WeChat Mini Program/App)
Backend: Alibaba Cloud uniCloud
Database: MongoDB
System Architecture
High-Level Components

    Frontend Layer - uni-app (Vue 2)
    Intelligent Agent Layer - AI-powered features
    Backend Layer - uniCloud Cloud Functions
    Data Layer - MongoDB + OSS Storage

Frontend Architecture
Technology Stack

    Framework: uni-app (Vue 2.x)
    UI Components: uView UI 2.0 + Custom Components
    State Management: Vuex (optional) + Local Storage
    Styling: SCSS with rpx responsive units

Page Structure

pages/
├── index/
│   └── index.vue - Main Dashboard
│
├── site/ (踏勘模块 - Site Inspection Module)
│   ├── index.vue - Multi-step inspection form
│   │   ├── Step 1: Basic Information (guishu, tankanyuan, didian, mingcheng)
│   │   ├── Step 2: Environment Information (7 fields)
│   │   ├── Step 3: Inspection Details (cleaning scope, equipment specs)
│   │   └── Step 4: Completion & Confirmation
│   ├── preview.vue - Data confirmation before save
│   └── status.vue - Status overview and history
│
├── construction/ (清洗模块 - Cleaning Work Module)
│   ├── index.vue - Multi-step cleaning record
│   │   ├── Step 1: Before Cleaning (photos by area/sub-option)
│   │   ├── Step 2: After Cleaning (photos matching before)
│   │   ├── Step 3: Work Photos (process documentation)
│   │   └── Step 4: Environment Notes
│   └── info.vue - Construction information
│
├── business/ (商户模块 - Business Management Module)
│   ├── index.vue - Business management menu
│   ├── info.vue - Basic business information form
│   └── customer.vue - Customer details
│
└── test/
    └── test.vue - uniCloud testing page

Key Features per Module
Site Inspection (踏勘)
    GPS location capture
    Multi-item equipment tracking
    Photo upload (before cleaning)
    Environment data collection
    Auto-save drafts every 30 seconds

Cleaning Work (清洗)
    Area-based photo organization
    Before/after photo comparison
    Sub-option selection per area
    Custom sub-options support
    Side notes per area

Business Management (商户)
    Customer information
    Parking details
    Reputation tracking
    Service history
    Contact management

Intelligent Agent Layer (AI Features)
Feature 1: OCR Recognition (设备标签识别)

Purpose: Automatically recognize equipment labels from photos and auto-fill form fields

Technology:
    Service: Alibaba Cloud OCR API
    Accuracy: 85-95%
    Response Time: 3-5 seconds
    Cost: ¥0.001/request

Implementation:
    Cloud Function: ocr-recognition
    Endpoint: https://ocr-api.cn-hangzhou.aliyuncs.com
    Method: RecognizeGeneral

Recognition Patterns:
javascript

// Model Number
Pattern: /型号[:：]\s*([A-Z0-9\-]+)/i
Example Input: "型号：ABC-123"
Output: model = "ABC-123"

// Specifications
Pattern: /规格[:：]\s*([^\n]+)/i
Example Input: "规格：直径300mm 长度10m"
Output: specifications = "直径300mm 长度10m"

// Manufacturer
Pattern: /(?:厂家|制造商|生产商)[:：]\s*([^\n]+)/i
Example Input: "制造商：北京XX设备公司"
Output: manufacturer = "北京XX设备公司"

// Serial Number
Pattern: /(?:序列号|编号|SN)[:：]\s*([A-Z0-9]+)/i
Example Input: "SN: ABC123456789"
Output: serialNumber = "ABC123456789"

User Flow:
    User clicks "📷 Smart Recognition" button
    Take photo of equipment label
    Upload to cloud storage
    Call OCR cloud function
    Parse recognition results
    Auto-fill form fields (model, specs, manufacturer, serial)
    User confirms or modifies

Error Handling:
    Recognition failed: Prompt manual input
    Partial recognition: Fill available fields, user completes rest
    Network error: Retry mechanism (3 attempts)

Feature 2: Smart Suggestions (智能推荐引擎)

Purpose: Provide intelligent auto-fill suggestions based on historical data

Technology:
    Algorithm: Frequency analysis + Pattern matching
    Data Source: Historical records database
    Confidence Scoring: Based on sample size

Confidence Levels:
    High: ≥10 records (recommended to apply directly)
    Medium: 5-9 records (review before applying)
    Low: 2-4 records (reference only)
    Very Low: <2 records (don't show suggestions)

Implementation:
    Cloud Function: smart-suggestions
    Query Logic: Fuzzy match location (first 5 chars) + exact company match
    Time Range: Recent 6 months
    Limit: Top 10 records

Use Cases:
A. Environment Information Suggestions
javascript

// Query
Input: location = "北京市朝阳区建国路"
Query: Find records with didian containing "北京市朝阳区"
Time: Last 6 months
Limit: 10 records

// Analysis
parkingEntrance frequency:
- "地下停车场A入口" (7 times, 70%)
- "地下停车场B入口" (2 times, 20%)
- "地面停车场" (1 time, 10%)

Recommendation: "地下停车场A入口" (70% frequency)
Confidence: High (10 records)

B. Cleaning Scope Suggestions
javascript

// Query
Input: companyName = "XX物业管理公司"
Query: Find records with guishu = "XX物业管理公司"

// Analysis
横管: 8 times (80%)
竖管: 7 times (70%)
风机: 6 times (60%)
净化器: 5 times (50%)
厨房烟罩: 4 times (40%)

Display: Show frequency and allow one-click selection

C. Business Info Suggestions
javascript
// Query
Input: location area
Analysis: 
- Average rating in area: 4.2 stars
- Common parking reaction: "良好" (65%)
- Average parking price: ¥5/hour

Display: As reference information

Algorithm Functions:
javascript

// 1. Query Historical Data
function queryHistoricalData(location, companyName) {
  const locationPattern = location.substring(0, 5);
  
  return db.collection('tankan_records')
    .where({
      didian: db.RegExp({ regexp: locationPattern, options: 'i' })
    })
    .where({
      createTime: db.command.gt(Date.now() - 6*30*24*60*60*1000)
    })
    .orderBy('createTime', 'desc')
    .limit(10);
}

// 2. Calculate Frequency
function calculateFrequency(records, field) {
  const counts = {};
  records.forEach(record => {
    const value = record[field];
    if (value) {
      counts[value] = (counts[value] || 0) + 1;
    }
  });
  
  return Object.entries(counts)
    .map(([value, count]) => ({
      value,
      count,
      percentage: Math.round(count / records.length * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

// 3. Calculate Confidence
function calculateConfidence(count) {
  if (count >= 10) return 'high';
  if (count >= 5) return 'medium';
  if (count >= 2) return 'low';
  return 'very_low';
}

Expected Results:
    Input efficiency improvement: 50-70%
    Data consistency improvement: Significant
    User experience: Much improved
    Adoption rate: 60-80%

Feature 3: Smart Data Validation (智能数据验证)

Purpose: Real-time anomaly detection to prevent erroneous data entry

Technology:
    Algorithm: Rule engine + Statistical analysis
    Trigger: Real-time validation + Pre-submit validation
    Response: Instant feedback + Block/Warn

Validation Types:
A. Range Validation
javascript
const rangeRules = {
  price: { min: 0, max: 100000 },      // Warning if > 100k
  pipeLength: { min: 0, max: 1000 },   // Warning if > 1000m
  fanCount: { min: 0, max: 50 },       // Warning if > 50 units
  rating: { min: 1, max: 5 },          // Error if outside 1-5
  quantity: { min: 0 }                 // Error if negative
};

// Example
Input: parkingPrice = 150000
Validation: price > 100000
Result: ⚠️ Warning
Message: "停车价格 ¥150,000 异常高（超过常规范围），是否确认继续？"
Action: User can confirm to continue

B. Format Validation
const formatRules = {
  phone: /^1[3-9]\d{9}$/,
  email: /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/
};

// Example
Input: phone = "12345678"
Validation: Does not match pattern
Result: ❌ Error
Message: "手机号格式不正确，请输入11位有效手机号"
Action: Block submission until fixed

C. Business Logic Validation
// Required fields check
if (!formData.guishu) {
  errors.push("归属公司不能为空");
}

// Photo count check
if (photoBefore.length === 0) {
  warnings.push("清洗前照片未上传，建议上传照片记录现场情况");
}

// Location completeness
if (didian.length < 5) {
  warnings.push("地点信息过于简略，建议补充详细地址");
}

D. Statistical Anomaly Detection (Z-score)
// Formula: Z = (X - μ) / σ
// X = current value
// μ = historical mean
// σ = standard deviation

// Example: Price anomaly detection
Historical data: [5, 6, 5, 7, 6, 5, 8, 6] (yuan/hour)
Mean μ = 6
Std deviation σ = 1

Current input: X = 15 yuan/hour
Z-score = (15 - 6) / 1 = 9

Judgment: Z > 2 → ⚠️ Anomaly
Message: "停车价格明显高于该区域平均水平"

Validation Flow:
Real-time validation (on input): Format + Range
Step validation (on step change): Required fields + Business logic
Submit validation (before final submit): Completeness + Anomaly detection

User Experience:
Clear error messages with solutions
Tiered responses: Error (block) / Warning (prompt) / Info (suggest)
Batch display: Show all issues at once
Skip option: Allow informed users to continue after warning

Feature 4: Smart Template Selection (智能模板选择)
Purpose: Automatically select optimal report template based on data characteristics
Technology:
Algorithm: Decision tree + Rule matching
Trigger: Report generation
Output: Optimal template + format

Decision Tree:
[Record Type]
    |
    ├── [Inspection]
    │   ├── Has environmentData?
    │   │   ├── Yes → Full Template
    │   │   └── No → Simple Template
    │   └── Item count > 10?
    │       ├── Yes → Detailed Template (paginated)
    │       └── No → Standard Template (single page)
    |
    ├── [Construction]
    │   ├── Area count > 5?
    │   │   ├── Yes → Detailed Template (one page per area)
    │   │   └── No → Summary Template (all areas on one page)
    │   └── Has workPhotos?
    │       ├── Yes → Image-Text Template
    │       └── No → Text-Only Template
    |
    └── [Business]
        ├── Has customerInfo?
        │   ├── Yes → Full Template
        │   └── No → Basic Template
        └── Has serviceHistory?
            ├── Yes → Historical Comparison Template
            └── No → Snapshot Template

Format Recommendations:
Excel (Default): Best for data-heavy reports, easy to edit, supports formulas
PDF (Official): Best for formal submission, printing, archival
Word (Editable): Best for collaborative editing, adding comments

Implementation:
function selectTemplate(record, recordType) {
  let template = 'standard';
  
  if (recordType === 'tankan') {
    if (record.environmentData && Object.keys(record.environmentData).length > 0) {
      template = 'tankan_full';
    } else {
      template = 'tankan_simple';
    }
    
    if (record.qingxifanwei && record.qingxifanwei.length > 10) {
      template = 'tankan_detailed';
    }
  }
  
  else if (recordType === 'construction') {
    if (record.cleaningAreas.length > 5) {
      template = 'construction_detailed';
    } else {
      template = 'construction_summary';
    }
  }
  
  else if (recordType === 'business') {
    template = record.customerInfo ? 'business_full' : 'business_basic';
  }
  
  return template;
}