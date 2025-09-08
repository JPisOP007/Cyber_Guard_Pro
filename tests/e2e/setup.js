const { chromium } = require('@playwright/test');

// Global setup for E2E tests
module.exports = async (config) => {
  console.log('Setting up E2E test environment...');
  
  // Launch browser for authentication setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Wait for the app to be ready
    await page.waitForSelector('[data-testid="login-form"]', { timeout: 30000 });
    
    console.log('✅ Application is ready for testing');
    
    // Pre-authenticate a test user if needed
    // This could involve creating a test account or using demo credentials
    
  } catch (error) {
    console.error('❌ Failed to setup E2E environment:', error);
    throw error;
  } finally {
    await browser.close();
  }
};

// Helper function to wait for services
async function waitForServices() {
  const maxAttempts = 30;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      // Check if backend is ready
      const response = await fetch('http://localhost:5000/api/health');
      if (response.ok) {
        console.log('✅ Backend service is ready');
        return true;
      }
    } catch (error) {
      // Service not ready yet
    }
    
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Services did not start within expected time');
}

module.exports.waitForServices = waitForServices;