// System Status Checker
// Run this after starting your server to verify everything works

async function fetchJson(url, { method = 'GET', body, timeout = 5000 } = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(id);
  }
}

async function checkSystemStatus() {
  console.log('🔍 CyberGuard Pro System Status Check\n');

  const checks = {
    server: false,
    metrics: false,
    realTimeData: false,
    apiIntegration: false
  };

  // Check 1: Server Health
  console.log('1️⃣  Checking server health...');
  try {
    const response = await fetchJson('http://localhost:5000/api/health', { timeout: 5000 });
    if (response.ok && response.data.status === 'OK') {
      console.log('✅ Server: Running and healthy');
      console.log(`   Uptime: ${Math.floor(response.data.uptime)} seconds`);
      checks.server = true;
    }
  } catch (error) {
    console.log('❌ Server: Not responding');
    console.log('   Make sure server is running: npm run dev');
    return;
  }

  console.log('');

  // Check 2: Real-time Metrics
  console.log('2️⃣  Checking real-time metrics...');
  try {
    const response = await fetchJson('http://localhost:5000/api/metrics/realtime', { timeout: 5000 });
    if (response.ok && response.data.success) {
      console.log('✅ Metrics API: Working');
      
      const data = response.data.data;
      console.log(`   Active Threats: ${data.activeThreats}`);
      console.log(`   System Health: ${data.systemHealth}%`);
      console.log(`   Last Updated: ${new Date(data.lastUpdated).toLocaleTimeString()}`);
      
      checks.metrics = true;

      // Check if we have real-time data indicators
      if (data.sourceBreakdown && Object.keys(data.sourceBreakdown).length > 0) {
        console.log('✅ Real-time Data: Active');
        console.log('   Sources:', Object.keys(data.sourceBreakdown).join(', '));
        checks.realTimeData = true;
      } else {
        console.log('⚠️  Real-time Data: No sources detected yet (may take 5-10 minutes)');
      }

      // Check API integration
      const apiSources = ['virustotal', 'shodan', 'hibp'];
      const activeSources = apiSources.filter(source => 
        data.sourceBreakdown && data.sourceBreakdown[source] > 0
      );
      
      if (activeSources.length > 0) {
        console.log('✅ API Integration: Working');
        console.log(`   Active APIs: ${activeSources.join(', ')}`);
        checks.apiIntegration = true;
      } else {
        console.log('⚠️  API Integration: No API data yet (normal for first 5-10 minutes)');
      }
    }
  } catch (error) {
    console.log('❌ Metrics API: Failed');
    console.log(`   Error: ${error.message}`);
  }

  console.log('');

  // Check 3: Force metrics refresh
  console.log('3️⃣  Testing metrics refresh...');
  try {
    const response = await fetchJson('http://localhost:5000/api/metrics/refresh', { method: 'POST', timeout: 10000 });
    if (response.ok && response.data.success) {
      console.log('✅ Metrics Refresh: Working');
      console.log('   Metrics can be updated on demand');
    }
  } catch (error) {
    console.log('❌ Metrics Refresh: Failed');
    console.log(`   Error: ${error.message}`);
  }

  console.log('');

  // Overall Status
  console.log('📊 Overall System Status:');
  console.log('========================');
  
  const workingChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  
  console.log(`Components Working: ${workingChecks}/${totalChecks}`);
  
  if (checks.server && checks.metrics) {
    console.log('✅ Status: OPERATIONAL');
    
    if (checks.realTimeData && checks.apiIntegration) {
      console.log('🚀 Mode: LIVE THREAT INTELLIGENCE ACTIVE');
      console.log('   Your system is collecting real threat data!');
    } else {
      console.log('⏳ Mode: INITIALIZING LIVE DATA');
      console.log('   Wait 5-10 minutes for API data to populate');
      console.log('   System will automatically switch to live mode');
    }
  } else {
    console.log('❌ Status: ISSUES DETECTED');
    console.log('   Check server startup and configuration');
  }

  console.log('\n🎯 What to Expect:');
  console.log('==================');
  console.log('• First 5 minutes: System initializing, may show low activity');
  console.log('• After 5-10 minutes: Live API data should start appearing');  
  console.log('• Ongoing: Threat alerts every 2-5 minutes (when threats exist)');
  console.log('• Dashboard: Updates every 30 seconds with live metrics');
  
  console.log('\n🌐 Frontend Check:');
  console.log('=================');
  console.log('Open http://localhost:3000 and look for:');
  console.log('• Dashboard showing live metrics');
  console.log('• Source breakdown with "virustotal", "shodan" entries');
  console.log('• System health percentage');
  console.log('• Real-time threat alerts (as they occur)');

  console.log('\n🔧 Troubleshooting:');
  console.log('===================');
  if (!checks.server) {
    console.log('• Server not running → cd server && npm run dev');
  }
  if (!checks.realTimeData) {
    console.log('• No real-time data → Check .env file has API keys');
    console.log('• Run: node test-api-keys.js to verify API configuration');
  }
  if (!checks.apiIntegration) {
    console.log('• API integration issues → Check server console for error messages');
    console.log('• Verify API keys have proper permissions');
  }
}

// Run the check
checkSystemStatus().catch(error => {
  console.error('❌ Status check failed:', error.message);
  console.log('\n🔧 Quick fixes:');
  console.log('• Make sure server is running: cd server && npm run dev');
  console.log('• Check if port 5000 is available');
  console.log('• Verify .env configuration');
});