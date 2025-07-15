# Care Plan Assignments API Test Examples

## Prerequisites
1. Make sure the application is running: `npm run start:dev`
2. Get a JWT token by logging in through the auth endpoints
3. Have valid ObjectIds for staff, residents, family members, and care plans

## Test Examples

### 1. Create a Care Plan Assignment

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
    "consultation_notes": "Initial consultation completed. Resident shows good mobility and cognitive function.",
    "selected_room_type": "2_bed",
    "total_monthly_cost": 5000000,
    "room_monthly_cost": 2000000,
    "care_plans_monthly_cost": 3000000,
    "start_date": "2024-02-01T00:00:00.000Z",
    "family_preferences": {
      "preferred_room_gender": "female",
      "preferred_floor": 2,
      "special_requests": "Near window, quiet area"
    },
    "additional_medications": [
      {
        "medication_name": "Vitamin D",
        "dosage": "1000 IU",
        "frequency": "Once daily"
      }
    ],
    "status": "consulting",
    "payment_status": "pending",
    "notes": "Family prefers morning consultation hours"
  }'
```

### 2. Get All Care Plan Assignments

```bash
curl -X GET http://localhost:3000/care-plan-assignments \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Get Care Plan Assignment by ID

```bash
curl -X GET http://localhost:3000/care-plan-assignments/507f1f77bcf86cd799439016 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Get Assignments by Resident

```bash
curl -X GET http://localhost:3000/care-plan-assignments/by-resident/507f1f77bcf86cd799439014 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Get Assignments by Family Member

```bash
curl -X GET http://localhost:3000/care-plan-assignments/by-family-member/507f1f77bcf86cd799439015 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Get Assignments by Status

```bash
curl -X GET http://localhost:3000/care-plan-assignments/by-status/consulting \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 7. Update Assignment Status

```bash
curl -X PATCH "http://localhost:3000/care-plan-assignments/507f1f77bcf86cd799439016/status?status=active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 8. Update Payment Status

```bash
curl -X PATCH "http://localhost:3000/care-plan-assignments/507f1f77bcf86cd799439016/payment-status?paymentStatus=deposit_paid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 9. Update Assignment Details

```bash
curl -X PATCH http://localhost:3000/care-plan-assignments/507f1f77bcf86cd799439016 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assigned_room_id": "507f1f77bcf86cd799439017",
    "assigned_bed_id": "507f1f77bcf86cd799439018",
    "status": "room_assigned",
    "notes": "Room 201, Bed A assigned successfully"
  }'
```

### 10. Delete Assignment (Admin only)

```bash
curl -X DELETE http://localhost:3000/care-plan-assignments/507f1f77bcf86cd799439016 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Expected Responses

### Successful Creation (201)
```json
{
  "_id": "507f1f77bcf86cd799439016",
  "staff_id": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Dr. Smith",
    "email": "smith@nursinghome.com"
  },
  "care_plan_ids": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Basic Care Package",
      "description": "Daily care and monitoring",
      "price": 2000000
    }
  ],
  "resident_id": {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Mrs. Johnson",
    "date_of_birth": "1940-05-15T00:00:00.000Z"
  },
  "family_member_id": {
    "_id": "507f1f77bcf86cd799439015",
    "name": "John Johnson",
    "email": "john@email.com"
  },
  "registration_date": "2024-01-15T00:00:00.000Z",
  "consultation_notes": "Initial consultation completed",
  "selected_room_type": "2_bed",
  "total_monthly_cost": 5000000,
  "room_monthly_cost": 2000000,
  "care_plans_monthly_cost": 3000000,
  "start_date": "2024-02-01T00:00:00.000Z",
  "status": "consulting",
  "payment_status": "pending",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

### Error Response (400)
```json
{
  "statusCode": 400,
  "message": "Invalid ID format",
  "error": "Bad Request"
}
```

## Notes

1. **ObjectId Format**: All IDs must be valid MongoDB ObjectId strings (24 hex characters)
2. **Date Format**: Use ISO 8601 format for dates (e.g., "2024-01-15T00:00:00.000Z")
3. **Authentication**: All requests require a valid JWT token in the Authorization header
4. **Role-based Access**: Different endpoints require different user roles
5. **Validation**: The API validates all input data according to the schema requirements

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

### Room Types
- `2_bed`: 2-bed room
- `3_bed`: 3-bed room
- `4_5_bed`: 4-5 bed room
- `6_8_bed`: 6-8 bed room 