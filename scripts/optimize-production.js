#!/usr/bin/env node

// Production optimization script
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production optimization...');

// 1. Set production environment variables
process.env.NODE_ENV = 'production';
process.env.NODE_OPTIONS = '--max-old-space-size=1024';

// 2. Optimize memory settings
const v8 = require('v8');
v8.setFlagsFromString('--max-old-space-size=1024');

// 3. Set timezone
process.env.TZ = 'Asia/Ho_Chi_Minh';

// 4. Disable unnecessary features in production
process.env.DISABLE_SWAGGER = 'true'; // Disable Swagger in production if needed

// 5. Log optimization settings
console.log('✅ Production optimization applied:');
console.log(`- Memory limit: ${v8.getHeapStatistics().heap_size_limit / 1024 / 1024} MB`);
console.log(`- Timezone: ${process.env.TZ}`);
console.log(`- Node environment: ${process.env.NODE_ENV}`);

// 6. Force garbage collection if available
if (global.gc) {
  global.gc();
  console.log('✅ Garbage collection performed');
}

console.log('🎉 Production optimization completed!');
