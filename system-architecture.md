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