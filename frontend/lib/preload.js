/**
 * Preload critical modules to improve cold start performance
 * This file is loaded before the Next.js server starts
 */

// Only run in production or when explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_PRELOAD === 'true') {
  console.log('Preloading critical modules...');
  
  const startTime = Date.now();
  
  // Preload Node.js built-in modules
  require('crypto');
  require('path');
  require('fs');
  require('url');
  require('stream');
  require('util');
  require('events');
  require('buffer');
  
  // Preload critical Next.js modules
  try {
    require('next/dist/server/next');
    require('next/dist/server/require');
    require('next/dist/compiled/react/index');
    require('next/dist/compiled/react-dom/server');
  } catch (e) {
    // Ignore errors during preload
  }
  
  // Preload frequently used dependencies
  const dependencies = [
    'react',
    'react-dom',
    'next/router',
    'next/link',
    'next/image',
    'next/head',
  ];
  
  dependencies.forEach(dep => {
    try {
      require(dep);
    } catch (e) {
      // Ignore errors for optional dependencies
    }
  });
  
  const endTime = Date.now();
  console.log(`Module preloading completed in ${endTime - startTime}ms`);
}

// Export empty object to make it a valid module
module.exports = {};