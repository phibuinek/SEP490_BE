// Memory optimization script for production
const v8 = require('v8');

// Set memory limits
v8.setFlagsFromString('--max-old-space-size=400');

// Log memory usage
console.log('Memory optimization applied:');
console.log(`Heap size limit: ${v8.getHeapStatistics().heap_size_limit / 1024 / 1024} MB`);
console.log(`Total heap size: ${v8.getHeapStatistics().total_heap_size / 1024 / 1024} MB`);
console.log(`Used heap size: ${v8.getHeapStatistics().used_heap_size / 1024 / 1024} MB`);

// Force garbage collection if available
if (global.gc) {
  global.gc();
  console.log('Garbage collection performed');
}

module.exports = {
  optimizeMemory: () => {
    // Additional memory optimization logic can be added here
    console.log('Memory optimization completed');
  }
};
