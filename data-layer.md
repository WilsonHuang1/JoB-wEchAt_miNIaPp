Database Schema

Collection 1: tankan_records (Site Inspection Records)
Purpose: Store field inspection records

Schema:
{
  "_id": "ObjectId (auto-generated)",
  "guishu": "String (Required) - Company name",
  "tankanyuan": "String (Required) - Inspector name",
  "didian": "String - Location",
  "mingcheng": "String (Required) - Project name",
  "qingxifanwei": ["Array<String> - Cleaning scope items"],
  
  "environmentData": {
    "parkingEntrance": "String - Parking entrance",
    "recommendedParking": "String - Recommended parking spot",
    "elevatorEntrance": "String - Elevator entrance",
    "recommendedRoute": "String - Recommended route",
    "rooftopEnvironment": "String - Rooftop environment",
    "waterElectricity": "String - Water/electricity access",
    "otherConditions": "String - Other conditions"
  },
  
  "specDetails": "Object - Equipment specifications (dynamic structure)",
  "multipleEntries": "Object - Multiple entries data",
  "summaryData": "Object - Summary statistics",
  
  "location": {
    "latitude": "Double - GPS latitude",
    "longitude": "Double - GPS longitude",
    "address": "String - Parsed address"
  },
  
  "createTime": "Timestamp (auto: $env.now)",
  "userId": "String - Creator user ID",
  "status": "String (enum: draft|submitted|approved|rejected, default: draft)"
}

Indexes:
userId_createTime: Compound index (userId ASC, createTime DESC)
status_createTime: Compound index (status ASC, createTime DESC)

Permissions:
{
  ".read": true,
  ".create": true,
  ".update": "doc.userId == auth.uid",
  ".delete": "doc.userId == auth.uid"
}

Collection 2: construction_records (Cleaning Work Records)
Purpose: Store cleaning work records

Schema:
{
  "_id": "ObjectId",
  "projectName": "String - Project name",
  "projectLocation": "String - Project location",
  "cleaningDate": "Timestamp - Cleaning date",
  "cleaningAreas": ["Array<String> (Required) - Cleaning areas"],
  
  "selectedSubOptions": {
    "kitchen": ["environment", "stove"],
    "pipe": ["pipe_leak"]
  },
  
  "customSubOptions": {
    "kitchen": "Custom text for kitchen",
    "pipe": "Custom text for pipe"
  },
  
  "sideNotes": {
    "kitchen": "Kitchen notes",
    "pipe": "Pipe notes"
  },
  
  "detailedBeforePhotos": {
    "kitchen": {
      "environment": ["cloud://photo1.jpg", "cloud://photo2.jpg"],
      "stove": ["cloud://photo3.jpg"]
    }
  },
  
  "detailedAfterPhotos": {
    // Same structure as detailedBeforePhotos
  },
  
  "workPhotos": ["Array<String> - Work process photos"],
  "environmentNotes": "String - Environment notes",
  "workerName": "String - Worker name",
  "workerCompany": "String - Worker company",
  
  "location": "Object - GPS location (same as tankan_records)",
  
  "createTime": "Timestamp",
  "updateTime": "Timestamp",
  "userId": "String (Required)",
  "status": "String (enum: draft|submitted|completed|verified, default: draft)",
  "relatedInspectionId": "String - Related inspection record ID"
}

Indexes:
userId_createTime
status_createTime
relatedInspectionId (sparse index)

Permissions: Same as tankan_records

Collection 3: business_info (Business Information)
Purpose: Store customer/business information

Schema:
{
  "_id": "ObjectId",
  "name": "String (Required) - Business name",
  "location": "String (Required) - Business location",
  "appearance": "String - Appearance description",
  "parkingEntrance": "String - Parking entrance",
  "parkingPrice": "String - Parking price",
  "parkingReaction": "String (enum: 良好|一般|较差|无停车位, default: 一般)",
  "reputation": "String - Reputation",
  "businessType": "String (enum: 餐饮|酒店|商场|写字楼|工厂|其他)",
  
  "customerInfo": {
    "storefront": "String - Storefront description",
    "previousCleaning": "String - Previous cleaning history",
    "cleaningReason": "String - Cleaning reason",
    "contactPerson": "String - Contact person",
    "contactPhone": "String - Contact phone",
    "contactPosition": "String - Contact position",
    "notes": "String - Notes"
  },
  
  "photos": ["Array<String> - Business photos"],
  "gpsLocation": "Object - GPS location",
  "operatingHours": "String - Operating hours",
  
  "serviceHistory": [{
    "serviceDate": "Timestamp",
    "serviceType": "String",
    "recordId": "String - Related record ID",
    "notes": "String"
  }],
  
  "tags": ["Array<String> - Tags for categorization"],
  "isActive": "Boolean (default: true) - Active customer flag",
  "rating": "Int (1-5) - Customer rating",
  
  "createTime": "Timestamp",
  "updateTime": "Timestamp",
  "userId": "String",
  "lastServiceDate": "Timestamp - Last service date",
  "nextScheduledService": "Timestamp - Next scheduled service"
}

Indexes:
name_location: Compound index
userId_createTime
isActive_rating: Compound index (isActive ASC, rating DESC)
lastServiceDate: Sparse index, DESC

Permissions:
{
  ".read": true,
  ".create": true,
  ".update": "doc.userId == auth.uid || auth.role.includes('admin')",
  ".delete": "auth.role.includes('admin')"
}

Collection 4: workers (Staff Information)
Purpose: Store staff information

Schema:
{
  "_id": "ObjectId",
  "name": "String (Required) - Staff name",
  "department": "String (Required) - Department",
  "position": "String - Position",
  "phone": "String - Phone number",
  "email": "String - Email",
  "isActive": "Boolean (default: true) - Active staff flag"
}

Permissions:
{
  ".read": true,
  ".create": "auth.role.includes('admin')",
  ".update": "auth.role.includes('admin')",
  ".delete": "auth.role.includes('admin')"
}