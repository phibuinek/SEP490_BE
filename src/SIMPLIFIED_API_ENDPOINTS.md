# Simplified API Endpoints - Two Clear Options

## 📋 Tổng quan
Đơn giản hóa API endpoints thành 2 lựa chọn rõ ràng cho mỗi resource:
1. **Endpoint gốc** - Chỉ lấy records đang hoạt động (active)
2. **Endpoint `/all-statuses`** - Lấy tất cả trạng thái

## 🚀 API Endpoints

### **1. Residents APIs**

#### **GET /residents** (Active Only)
```javascript
GET /residents?page=1&limit=10
```
- **Mô tả:** Lấy residents đang hoạt động
- **Statuses:** `accepted`, `admitted`, `active`
- **Permissions:** ADMIN, STAFF
- **Pagination:** Có hỗ trợ

**Response Example:**
```javascript
{
  "data": [
    {
      "_id": "...",
      "full_name": "Nguyễn Văn A",
      "status": "active",        // ✅ Chỉ active residents
      "admission_date": "2024-01-15T00:00:00.000Z",
      "family_member_id": { ... }
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10
}
```

#### **GET /residents/all-statuses** (All Statuses)
```javascript
GET /residents/all-statuses?page=1&limit=10
```
- **Mô tả:** Lấy tất cả residents với mọi trạng thái
- **Statuses:** `pending`, `accepted`, `rejected`, `admitted`, `active`, `discharged`, `deceased`
- **Permissions:** ADMIN, STAFF
- **Pagination:** Có hỗ trợ

**Response Example:**
```javascript
{
  "data": [
    {
      "_id": "...",
      "full_name": "Nguyễn Văn A",
      "status": "active",        // ✅ Active resident
      "admission_date": "2024-01-15T00:00:00.000Z"
    },
    {
      "_id": "...",
      "full_name": "Trần Thị B",
      "status": "discharged",    // 🔍 Discharged resident
      "discharge_date": "2024-09-30T00:00:00.000Z"
    },
    {
      "_id": "...",
      "full_name": "Lê Văn C",
      "status": "pending",       // 🔍 Pending approval
      "created_at": "2024-10-01T00:00:00.000Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10
}
```

### **2. Bed Assignments APIs**

#### **GET /bed-assignments** (Active Only)
```javascript
GET /bed-assignments
GET /bed-assignments?bed_id=507f1f77bcf86cd799439011
GET /bed-assignments?resident_id=507f1f77bcf86cd799439012
```
- **Mô tả:** Lấy bed assignments đang hoạt động
- **Statuses:** `active`
- **Permissions:** ADMIN, STAFF (FAMILY có hạn chế)
- **Query Parameters:** `bed_id`, `resident_id`, `include_inactive`, `statuses`

**Response Example:**
```javascript
[
  {
    "_id": "...",
    "status": "active",         // ✅ Chỉ active assignments
    "assigned_date": "2024-01-15T00:00:00.000Z",
    "resident_id": { "full_name": "Nguyễn Văn A", "status": "active" },
    "bed_id": { 
      "bed_number": "B001", 
      "room_id": { "room_number": "101" } 
    }
  }
]
```

#### **GET /bed-assignments/all-statuses** (All Statuses)
```javascript
GET /bed-assignments/all-statuses
GET /bed-assignments/all-statuses?bed_id=507f1f77bcf86cd799439011
GET /bed-assignments/all-statuses?resident_id=507f1f77bcf86cd799439012
```
- **Mô tả:** Lấy tất cả bed assignments với mọi trạng thái
- **Statuses:** `pending`, `completed`, `active`, `done`, `rejected`, `discharged`, `exchanged`, `cancelled`
- **Permissions:** ADMIN, STAFF
- **Query Parameters:** `bed_id`, `resident_id`

**Response Example:**
```javascript
[
  {
    "_id": "...",
    "status": "active",         // ✅ Active assignment
    "assigned_date": "2024-01-15T00:00:00.000Z",
    "resident_id": { "full_name": "Nguyễn Văn A" },
    "bed_id": { "bed_number": "B001", "room_id": { "room_number": "101" } }
  },
  {
    "_id": "...",
    "status": "done",           // 🔍 Completed assignment
    "assigned_date": "2023-12-01T00:00:00.000Z",
    "unassigned_date": "2024-01-14T23:59:59.000Z",
    "resident_id": { "full_name": "Nguyễn Văn A" },
    "bed_id": { "bed_number": "A005", "room_id": { "room_number": "205" } }
  },
  {
    "_id": "...",
    "status": "pending",        // 🔍 Pending assignment
    "assigned_date": "2024-10-01T00:00:00.000Z",
    "resident_id": { "full_name": "Trần Thị D" },
    "bed_id": { "bed_number": "C003", "room_id": { "room_number": "301" } }
  }
]
```

## 💡 Lợi ích của cách tiếp cận đơn giản

### **1. Rõ ràng và dễ hiểu**
```javascript
// ✅ Rõ ràng ngay từ URL
GET /residents              // → Chỉ active residents
GET /residents/all-statuses // → Tất cả residents

GET /bed-assignments              // → Chỉ active assignments  
GET /bed-assignments/all-statuses // → Tất cả assignments
```

### **2. Không cần nhớ query parameters**
```javascript
// ❌ Trước đây (phức tạp)
GET /residents?include_all_statuses=true

// ✅ Bây giờ (đơn giản)
GET /residents/all-statuses
```

### **3. API Documentation rõ ràng**
- **Swagger UI** hiển thị 2 endpoints riêng biệt
- **Mô tả** rõ ràng cho từng endpoint
- **Không confusion** về parameters

### **4. Frontend dễ implement**
```javascript
// Service layer trong frontend
class ResidentsService {
  // Lấy residents đang hoạt động
  async getActiveResidents(page = 1, limit = 10) {
    return fetch(`/api/residents?page=${page}&limit=${limit}`);
  }
  
  // Lấy tất cả residents (bao gồm discharged, deceased, etc.)
  async getAllResidents(page = 1, limit = 10) {
    return fetch(`/api/residents/all-statuses?page=${page}&limit=${limit}`);
  }
}

class BedAssignmentsService {
  // Lấy bed assignments đang active
  async getActiveBedAssignments(residentId) {
    return fetch(`/api/bed-assignments?resident_id=${residentId}`);
  }
  
  // Lấy lịch sử bed assignments (tất cả trạng thái)
  async getBedAssignmentHistory(residentId) {
    return fetch(`/api/bed-assignments/all-statuses?resident_id=${residentId}`);
  }
}
```

## 🔧 Implementation Details

### **Service Layer Changes:**

#### **Residents Service:**
```typescript
// Method gốc - chỉ active residents
async findAll(pagination: PaginationDto): Promise<PaginatedResponse<Resident>> {
  const filter = {
    $or: [{ is_deleted: false }, { is_deleted: { $exists: false } }],
    status: { $in: [ResidentStatus.ACCEPTED, ResidentStatus.ADMITTED, ResidentStatus.ACTIVE] }
  };
  // ... implementation
}

// Method mới - tất cả trạng thái
async findAllWithAllStatuses(pagination: PaginationDto): Promise<PaginatedResponse<Resident>> {
  const filter = { $or: [{ is_deleted: false }, { is_deleted: { $exists: false } }] };
  // ... implementation (không filter theo status)
}
```

#### **Bed Assignments Service:**
```typescript
// Method gốc - chỉ active assignments
async findAll(bed_id?: string, resident_id?: string, activeOnly = true) {
  const filter: any = {};
  // ... add bed_id, resident_id filters
  if (activeOnly) {
    filter.status = 'active';
  }
  // ... implementation
}

// Method mới - tất cả trạng thái
async findAllWithAllStatuses(bed_id?: string, resident_id?: string) {
  const filter: any = {};
  // ... add bed_id, resident_id filters
  // Không filter theo status
  // ... implementation
}
```

## 🚀 Cách sử dụng trong thực tế

### **Dashboard Admin:**
```javascript
// Tab "Active Residents" - hiển thị residents đang hoạt động
const activeResidents = await fetch('/api/residents');

// Tab "All Residents" - hiển thị tất cả (bao gồm discharged, deceased)
const allResidents = await fetch('/api/residents/all-statuses');

// Xem bed assignments hiện tại của resident
const currentBeds = await fetch(`/api/bed-assignments?resident_id=${residentId}`);

// Xem lịch sử bed assignments của resident
const bedHistory = await fetch(`/api/bed-assignments/all-statuses?resident_id=${residentId}`);
```

### **Reports & Analytics:**
```javascript
// Report residents đang active (cho operational metrics)
const activeCount = await fetch('/api/residents').then(r => r.json()).then(d => d.total);

// Report tổng số residents (cho historical analysis)
const totalCount = await fetch('/api/residents/all-statuses').then(r => r.json()).then(d => d.total);

// Bed utilization hiện tại
const activeBeds = await fetch('/api/bed-assignments');

// Bed assignment history (cho occupancy analysis)
const bedHistory = await fetch('/api/bed-assignments/all-statuses');
```

## ⚠️ Breaking Changes

### **Removed Features:**
- ❌ Query parameter `include_all_statuses` đã bị xóa
- ❌ Không còn conditional logic trong endpoint gốc

### **Migration Guide:**
```javascript
// ❌ Cũ (không còn hoạt động)
GET /residents?include_all_statuses=true
GET /bed-assignments?include_all_statuses=true

// ✅ Mới (thay thế)
GET /residents/all-statuses
GET /bed-assignments/all-statuses
```

## 🎯 Kết luận

Với cách tiếp cận đơn giản này:
- **2 endpoints rõ ràng** cho mỗi resource
- **Không cần nhớ** query parameters phức tạp
- **Dễ dàng maintain** và document
- **Frontend implementation** đơn giản hơn
- **API consistency** tốt hơn

Perfect cho việc sử dụng trong production! 🚀
