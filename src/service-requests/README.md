# Service Requests API

## Tổng quan
API quản lý các yêu cầu thay đổi dịch vụ từ phía gia đình cư dân, bao gồm 3 loại chính:

1. **CARE_PLAN_CHANGE** - Thay đổi gói chăm sóc
2. **SERVICE_DATE_CHANGE** - Gia hạn dịch vụ  
3. **ROOM_CHANGE** - Đổi phòng

## Workflow

### 1. CARE_PLAN_CHANGE (Thay đổi gói chăm sóc)
```
1. User tạo care plan assignment mới với status "pending"
2. User tạo bed assignment mới với status "pending" 
3. User gửi service request với target_care_plan_assignment_id và target_bed_assignment_id
4. Admin duyệt: 
   - Service request → "approved"
   - Target assignments → "accepted" (sẽ thành "active" vào đầu tháng sau)
   - Current assignments → "done" (vào cuối tháng hiện tại)
5. Admin từ chối:
   - Service request → "rejected"
   - Target assignments → "rejected"
```

### 2. SERVICE_DATE_CHANGE (Gia hạn dịch vụ)
```
1. User gửi service request với current_care_plan_assignment_id và new_end_date
2. Admin duyệt:
   - Service request → "approved"
   - Care plan assignment end_date được cập nhật thành new_end_date
3. Admin từ chối:
   - Service request → "rejected"
```

### 3. ROOM_CHANGE (Đổi phòng)
```
1. User tạo bed assignment mới với status "pending"
2. User gửi service request với target_bed_assignment_id
3. Admin duyệt:
   - Service request → "approved"
   - Target bed assignment → "active"
   - Current bed assignment → "exchanged"
4. Admin từ chối:
   - Service request → "rejected"
   - Target bed assignment → "rejected"
```

## API Endpoints

### Tạo Service Request
- `POST /service-requests` - Tạo yêu cầu chung (với examples cho 3 loại)
- `POST /service-requests/care-plan-change` - Tạo yêu cầu thay đổi gói chăm sóc
- `POST /service-requests/service-date-change` - Tạo yêu cầu gia hạn dịch vụ
- `POST /service-requests/room-change` - Tạo yêu cầu đổi phòng

### Quản lý Service Request
- `GET /service-requests` - Lấy danh sách tất cả yêu cầu (Admin only)
- `GET /service-requests/my` - Lấy danh cầu của gia đình (Family only)
- `PATCH /service-requests/:id/approve` - Duyệt yêu cầu (Admin only)
- `PATCH /service-requests/:id/reject` - Từ chối yêu cầu (Admin only)

## Ví dụ sử dụng

### 1. Thay đổi gói chăm sóc
```json
POST /service-requests/care-plan-change
{
  "resident_id": "507f1f77bcf86cd799439011",
  "family_member_id": "507f1f77bcf86cd799439012",
  "note": "Cần thay đổi gói dịch vụ do tình trạng sức khỏe của cư dân",
  "target_care_plan_assignment_id": "507f1f77bcf86cd799439013",
  "target_bed_assignment_id": "507f1f77bcf86cd799439014",
  "emergencyContactName": "Nguyễn Văn A",
  "emergencyContactPhone": "0901234567",
  "medicalNote": "Cư dân cần chăm sóc đặc biệt do bệnh tim"
}
```

### 2. Gia hạn dịch vụ
```json
POST /service-requests/service-date-change
{
  "resident_id": "507f1f77bcf86cd799439011",
  "family_member_id": "507f1f77bcf86cd799439012",
  "current_care_plan_assignment_id": "507f1f77bcf86cd799439015",
  "new_end_date": "2024-12-31T23:59:59.000Z",
  "emergencyContactName": "Nguyễn Văn A",
  "emergencyContactPhone": "0901234567",
  "medicalNote": "Cư dân cần chăm sóc đặc biệt do bệnh tim"
}
```

### 3. Đổi phòng
```json
POST /service-requests/room-change
{
  "resident_id": "507f1f77bcf86cd799439011",
  "family_member_id": "507f1f77bcf86cd799439012",
  "note": "Cần chuyển phòng do vấn đề về tiếng ồn",
  "target_bed_assignment_id": "507f1f77bcf86cd799439014",
  "emergencyContactName": "Nguyễn Văn A",
  "emergencyContactPhone": "0901234567",
  "medicalNote": "Cư dân cần chăm sóc đặc biệt do bệnh tim"
}
```

## Lưu ý quan trọng

1. **CARE_PLAN_CHANGE** và **ROOM_CHANGE** yêu cầu `note` (lý do)
2. **SERVICE_DATE_CHANGE** không yêu cầu `note`
3. User phải tạo assignments trước khi gửi request
4. Admin duyệt/từ chối sẽ ảnh hưởng đến trạng thái của các assignments liên quan
5. Tất cả API đều yêu cầu authentication và authorization phù hợp
