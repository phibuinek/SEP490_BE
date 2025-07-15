# Care Plan Assignments API

This module manages care plan assignments for residents in the nursing home management system.

## Features

- Create, read, update, and delete care plan assignments
- Filter assignments by resident, family member, or status
- Update assignment status and payment status
- Comprehensive validation and error handling
- Role-based access control

## API Endpoints

### Authentication Required
All endpoints require JWT authentication. Include the Bearer token in the Authorization header.

### Endpoints

#### POST `/care-plan-assignments`
Create a new care plan assignment
- **Roles**: STAFF, ADMIN
- **Body**: CreateCarePlanAssignmentDto

#### GET `/care-plan-assignments`
Get all care plan assignments
- **Roles**: STAFF, ADMIN

#### GET `/care-plan-assignments/:id`
Get a specific care plan assignment by ID
- **Roles**: STAFF, ADMIN, FAMILY_MEMBER

#### GET `/care-plan-assignments/by-resident/:residentId`
Get care plan assignments for a specific resident
- **Roles**: STAFF, ADMIN, FAMILY_MEMBER

#### GET `/care-plan-assignments/by-family-member/:familyMemberId`
Get care plan assignments for a specific family member
- **Roles**: STAFF, ADMIN, FAMILY_MEMBER

#### GET `/care-plan-assignments/by-status/:status`
Get care plan assignments by status
- **Roles**: STAFF, ADMIN
- **Status values**: consulting, packages_selected, room_assigned, payment_completed, active, completed, cancelled, paused

#### PATCH `/care-plan-assignments/:id`
Update a care plan assignment
- **Roles**: STAFF, ADMIN
- **Body**: UpdateCarePlanAssignmentDto

#### PATCH `/care-plan-assignments/:id/status?status=:status`
Update assignment status
- **Roles**: STAFF, ADMIN
- **Query parameter**: status

#### PATCH `/care-plan-assignments/:id/payment-status?paymentStatus=:paymentStatus`
Update payment status
- **Roles**: STAFF, ADMIN
- **Query parameter**: paymentStatus (pending, deposit_paid, fully_paid, overdue)

#### DELETE `/care-plan-assignments/:id`
Delete a care plan assignment
- **Roles**: ADMIN

## Data Model

### CarePlanAssignment Schema
- `staff_id`: ObjectId (required) - Staff member who created the assignment
- `care_plan_ids`: Array of ObjectIds (required) - Care plans assigned
- `resident_id`: ObjectId (required) - Resident receiving care
- `family_member_id`: ObjectId (required) - Family member contact
- `registration_date`: Date (required) - Initial registration date
- `consultation_notes`: String (optional) - Staff consultation notes
- `selected_room_type`: String (required) - Room type preference (2_bed, 3_bed, 4_5_bed, 6_8_bed)
- `assigned_room_id`: ObjectId (optional) - Assigned room
- `assigned_bed_id`: ObjectId (optional) - Assigned bed
- `family_preferences`: Object (optional) - Family preferences
- `total_monthly_cost`: Number (required) - Total monthly cost
- `room_monthly_cost`: Number (required) - Room monthly cost
- `care_plans_monthly_cost`: Number (required) - Care plans monthly cost
- `start_date`: Date (required) - Start date
- `end_date`: Date (optional) - End date
- `additional_medications`: Array (optional) - Additional medications
- `status`: String (required) - Assignment status
- `payment_status`: String (required) - Payment status
- `notes`: String (optional) - Staff notes
- `created_at`: Date (auto-generated)
- `updated_at`: Date (auto-generated)

## Testing Examples

### Create a Care Plan Assignment
```bash
curl -X POST http://localhost:3000/care-plan-assignments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "staff_id": "507f1f77bcf86cd799439011",
    "care_plan_ids": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
    "resident_id": "507f1f77bcf86cd799439014",
    "family_member_id": "507f1f77bcf86cd799439015",
    "registration_date": "2024-01-15T00:00:00.000Z",
    "consultation_notes": "Initial consultation completed",
    "selected_room_type": "2_bed",
    "total_monthly_cost": 5000000,
    "room_monthly_cost": 2000000,
    "care_plans_monthly_cost": 3000000,
    "start_date": "2024-02-01T00:00:00.000Z",
    "status": "consulting",
    "payment_status": "pending"
  }'
```

### Update Assignment Status
```bash
curl -X PATCH "http://localhost:3000/care-plan-assignments/507f1f77bcf86cd799439016/status?status=active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Assignments by Resident
```bash
curl -X GET http://localhost:3000/care-plan-assignments/by-resident/507f1f77bcf86cd799439014 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Status Values

### Assignment Status
- `consulting`: Initial consultation phase
- `packages_selected`: Care packages have been selected
- `room_assigned`: Room has been assigned
- `payment_completed`: Payment has been completed
- `active`: Assignment is active and ongoing
- `completed`: Assignment has been completed
- `cancelled`: Assignment has been cancelled
- `paused`: Assignment is temporarily paused

### Payment Status
- `pending`: Payment is pending
- `deposit_paid`: Deposit has been paid
- `fully_paid`: Full payment has been made
- `overdue`: Payment is overdue

## Error Handling

The API includes comprehensive error handling for:
- Invalid ObjectId formats
- Missing required fields
- Invalid enum values
- Database connection issues
- Authorization failures

All errors return appropriate HTTP status codes and descriptive error messages. 