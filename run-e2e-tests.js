const { execSync } = require('child_process');
const fetch = require('node-fetch').default || require('node-fetch');

async function checkServices() {
  console.log('🔍 Checking if services are running...');
  
  try {
    // Check backend health
    const backendResponse = await fetch('http://localhost:5000/api/health');
    if (backendResponse.ok) {
      console.log('✅ Backend service is running on port 5000');
    } else {
      throw new Error('Backend not responding correctly');
    }
  } catch (error) {
    console.log('❌ Backend service not available on port 5000');
    console.log('Please start the server: cd server && npm run dev');
    process.exit(1);
  }

  try {
    // Check frontend
    const frontendResponse = await fetch('http://localhost:3000');
    if (frontendResponse.ok) {
      console.log('✅ Frontend service is running on port 3000');
    } else {
      throw new Error('Frontend not responding correctly');
    }
  } catch (error) {
    console.log('❌ Frontend service not available on port 3000');
    console.log('Please start the client: cd client && npm start');
    process.exit(1);
  }
}

async function runTests() {
  await checkServices();
  
  console.log('\n🚀 Starting E2E tests for real-time threat monitoring...');
  console.log('Tests will use REAL, DYNAMIC data from the threat monitoring system');
  
  try {
    // Run the tests
    execSync('npx playwright test --config=playwright.config.js --reporter=list', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('\n✅ All E2E tests completed successfully!');
    
  } catch (error) {
    console.log('\n❌ Some tests failed. Check the output above for details.');
    process.exit(1);
  }
}

if (require.main === module) {
  runTests().catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
}

module.exports = { checkServices, runTests };