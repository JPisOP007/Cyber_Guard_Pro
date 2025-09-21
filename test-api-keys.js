// Simple API Key Test Script
// Run with: node test-api-keys.js

const https = require('https');
const fs = require('fs');
const path = require('path');

// Simple dotenv implementation
function loadEnv() {
  try {
    const envPath = path.join(__dirname, 'server', '.env');
    const envFile = fs.readFileSync(envPath, 'utf8');
    
    envFile.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  } catch (error) {
    console.log('⚠️  Could not load .env file. Make sure it exists in server/.env');
  }
}

// Simple HTTPS request function
function httpsRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

loadEnv();

async function testApiKeys() {
  console.log('🔍 Testing API Keys Configuration...\n');
  
  const results = {
    virustotal: false,
    shodan: false,
    hibp: false
  };

  // Test VirusTotal API
  if (process.env.VIRUSTOTAL_API_KEY) {
    console.log('🧪 Testing VirusTotal API...');
    try {
      const options = {
        hostname: 'www.virustotal.com',
        path: `/api/v3/users/me`,
        method: 'GET',
        headers: {
          'X-Apikey': process.env.VIRUSTOTAL_API_KEY
        }
      };

      const response = await httpsRequest(options);
      
      if (response.status === 200) {
        console.log('✅ VirusTotal API: WORKING');
        console.log(`   - User: ${response.data.data?.attributes?.username || response.data.data?.id || 'Unknown'}`);
        const daily = response.data.data?.attributes?.quotas?.api_requests_daily;
        if (daily) {
          console.log(`   - Quota: ${daily.allowed || 'Unknown'} allowed / ${daily.used || 0} used today`);
        }
        results.virustotal = true;
      } else {
        console.log(`❌ VirusTotal API: HTTP ${response.status}`);
        console.log(`   - Body: ${typeof response.data === 'string' ? response.data : JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.log('❌ VirusTotal API: FAILED');
      console.log(`   - Error: ${error.message}`);
    }
  } else {
    console.log('⚠️  VirusTotal API: Not configured');
  }

  console.log('');

  // Test Shodan API
  if (process.env.SHODAN_API_KEY) {
    console.log('🧪 Testing Shodan API...');
    try {
      const options = {
        hostname: 'api.shodan.io',
        path: `/api-info?key=${process.env.SHODAN_API_KEY}`,
        method: 'GET'
      };

      const response = await httpsRequest(options);
      
      if (response.status === 200) {
        console.log('✅ Shodan API: WORKING');
        console.log(`   - Plan: ${response.data.plan || 'Free'}`);
        console.log(`   - Query Credits: ${response.data.query_credits || 0}`);
        console.log(`   - Scan Credits: ${response.data.scan_credits || 0}`);
        results.shodan = true;
      }
    } catch (error) {
      console.log('❌ Shodan API: FAILED');
      console.log(`   - Error: ${error.message}`);
    }
  } else {
    console.log('⚠️  Shodan API: Not configured');
  }

  console.log('');

  // Test HIBP API (if configured)
  if (process.env.HIBP_API_KEY) {
    console.log('🧪 Testing HIBP API...');
    try {
      const options = {
        hostname: 'haveibeenpwned.com',
        path: '/api/v3/breaches',
        method: 'GET',
        headers: {
          'hibp-api-key': process.env.HIBP_API_KEY,
          'User-Agent': 'CyberGuard-Pro-Test'
        }
      };

      const response = await httpsRequest(options);
      
      if (response.status === 200) {
        console.log('✅ HIBP API: WORKING');
        console.log(`   - Recent breaches available: ${Array.isArray(response.data) ? response.data.length : 'Unknown'}`);
        results.hibp = true;
      }
    } catch (error) {
      console.log('❌ HIBP API: FAILED');
      console.log(`   - Error: ${error.message}`);
    }
  } else {
    console.log('⚠️  HIBP API: Not configured (paid service)');
  }

  console.log('\n📊 Summary:');
  console.log('================');
  
  const workingApis = Object.values(results).filter(Boolean).length;
  const totalConfigured = Object.entries(results).filter(([key, value]) => 
    process.env[`${key.toUpperCase()}_API_KEY`] || key === 'hibp'
  ).length;

  console.log(`Working APIs: ${workingApis}/${totalConfigured}`);
  
  if (workingApis >= 2) {
    console.log('✅ System Status: READY FOR LIVE MONITORING');
    console.log('   The threat monitoring system will use real-time data');
  } else if (workingApis >= 1) {
    console.log('⚠️  System Status: PARTIAL LIVE MONITORING');
    console.log('   Limited threat intelligence available');
  } else {
    console.log('❌ System Status: DEMO MODE ONLY');
    console.log('   No working API keys - will use demo data');
  }

  console.log('\n🚀 Next Steps:');
  if (workingApis > 0) {
    console.log('1. Start the server: npm run dev');
    console.log('2. Check console logs for "Real threat intelligence APIs detected"');
    console.log('3. Open http://localhost:3000 to view live dashboard');
    console.log('4. Monitor /api/metrics/realtime for live data');
  } else {
    console.log('1. Check API keys in .env file');
    console.log('2. Verify internet connectivity');
    console.log('3. Check API key permissions and quotas');
  }
}

// Run the test
testApiKeys().catch(console.error);