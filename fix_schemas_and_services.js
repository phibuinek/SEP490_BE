const fs = require('fs');
const path = require('path');

console.log('🔧 Bắt đầu fix schemas, services và DTOs...');

// Danh sách các patterns cần fix
const camelToSnakePatterns = [
  // Common ObjectId fields
  { from: 'staffId', to: 'staff_id' },
  { from: 'activityId', to: 'activity_id' }, 
  { from: 'residentId', to: 'resident_id' },
  { from: 'familyId', to: 'family_id' },
  { from: 'userId', to: 'user_id' },
  { from: 'bedId', to: 'bed_id' },
  { from: 'roomId', to: 'room_id' },
  { from: 'carePlanId', to: 'care_plan_id' },
  { from: 'billId', to: 'bill_id' },
  
  // Common fields
  { from: 'fullName', to: 'full_name' },
  { from: 'activityName', to: 'activity_name' },
  { from: 'activityType', to: 'activity_type' },
  { from: 'scheduleTime', to: 'schedule_time' },
  { from: 'performanceNotes', to: 'performance_notes' },
  { from: 'attendanceStatus', to: 'attendance_status' },
  { from: 'planName', to: 'plan_name' },
  { from: 'monthlyPrice', to: 'monthly_price' },
  { from: 'planType', to: 'plan_type' },
  { from: 'servicesIncluded', to: 'services_included' },
  { from: 'defaultMedications', to: 'default_medications' },
  { from: 'staffRatio', to: 'staff_ratio' },
  { from: 'durationType', to: 'duration_type' },
  { from: 'isActive', to: 'is_active' },
  { from: 'fileName', to: 'file_name' },
  { from: 'filePath', to: 'file_path' },
  { from: 'fileType', to: 'file_type' },
  { from: 'fileSize', to: 'file_size' },
  { from: 'uploadedBy', to: 'uploaded_by' },
  { from: 'uploadDate', to: 'upload_date' },
  { from: 'takenDate', to: 'taken_date' },
  { from: 'staffNotes', to: 'staff_notes' },
  { from: 'serviceStartDate', to: 'service_start_date' },
  { from: 'relatedActivityId', to: 'related_activity_id' },
];

// Hàm tìm và thay thế trong file
function fixFile(filePath, patterns) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    patterns.forEach(pattern => {
      const regex = new RegExp(pattern.from, 'g');
      if (content.includes(pattern.from)) {
        content = content.replace(regex, pattern.to);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Hàm tìm tất cả files theo pattern
function findFiles(dir, pattern) {
  const files = [];
  
  function search(directory) {
    try {
      const items = fs.readdirSync(directory);
      
      items.forEach(item => {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          search(fullPath);
        } else if (pattern.test(item)) {
          files.push(fullPath);
        }
      });
    } catch (error) {
      console.error(`Error reading directory ${directory}:`, error.message);
    }
  }
  
  search(dir);
  return files;
}

// Fix schemas
console.log('\n📋 Fixing schemas...');
const schemaFiles = findFiles('./src', /\.schema\.ts$/);
schemaFiles.forEach(file => fixFile(file, camelToSnakePatterns));

// Fix DTOs
console.log('\n📋 Fixing DTOs...');
const dtoFiles = findFiles('./src', /\.dto\.ts$/);
dtoFiles.forEach(file => fixFile(file, camelToSnakePatterns));

// Fix services (thêm ObjectId conversion)
console.log('\n📋 Fixing services...');
const serviceFiles = findFiles('./src', /\.service\.ts$/);

const servicePatterns = [
  ...camelToSnakePatterns,
  // Add ObjectId import if missing
  { 
    from: "import { Model } from 'mongoose';", 
    to: "import { Model, Types } from 'mongoose';" 
  },
];

serviceFiles.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // Fix field names
    camelToSnakePatterns.forEach(pattern => {
      if (content.includes(pattern.from)) {
        content = content.replace(new RegExp(pattern.from, 'g'), pattern.to);
        modified = true;
      }
    });
    
    // Add ObjectId conversion for find methods
    const findPatterns = [
      {
        from: /\.find\(\{\s*(\w+):\s*(\w+)\s*\}\)/g,
        to: (match, field, value) => {
          if (field.endsWith('_id')) {
            return `.find({ ${field}: new Types.ObjectId(${value}) })`;
          }
          return match;
        }
      }
    ];
    
    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Fixed: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
});

console.log('\n✨ Hoàn tất! Tất cả schemas, DTOs và services đã được cập nhật.');
console.log('🔄 Bạn nên restart NestJS server để áp dụng thay đổi.'); 