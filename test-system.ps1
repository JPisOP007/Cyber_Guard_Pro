# PowerShell System Test Script
# Test CyberGuard Pro API endpoints and system status

Write-Host "🔍 CyberGuard Pro System Test" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Function to test HTTP endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Name,
        [string]$Method = "GET",
        [hashtable]$Headers = @{}
    )
    
    try {
        Write-Host "Testing $Name..." -ForegroundColor Yellow
        
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -TimeoutSec 10
        } else {
            $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -Body "" -TimeoutSec 10
        }
        
        Write-Host "✅ $Name: SUCCESS" -ForegroundColor Green
        
        # Display relevant info based on endpoint
        if ($Name -eq "Health Check") {
            Write-Host "   Status: $($response.status)" -ForegroundColor Gray
            Write-Host "   Uptime: $([math]::Floor($response.uptime)) seconds" -ForegroundColor Gray
        }
        elseif ($Name -eq "Real-time Metrics") {
            Write-Host "   Active Threats: $($response.data.activeThreats)" -ForegroundColor Gray
            Write-Host "   System Health: $($response.data.systemHealth)%" -ForegroundColor Gray
            Write-Host "   Last Updated: $($response.data.lastUpdated)" -ForegroundColor Gray
            
            if ($response.data.sourceBreakdown) {
                Write-Host "   API Sources:" -ForegroundColor Gray
                $response.data.sourceBreakdown.PSObject.Properties | ForEach-Object {
                    Write-Host "     - $($_.Name): $($_.Value)" -ForegroundColor Gray
                }
            }
        }
        
        return $true
    }
    catch {
        Write-Host "❌ $Name: FAILED" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
    
    Write-Host ""
}

# Test if server is running
Write-Host "1️⃣  Server Connectivity Tests" -ForegroundColor Blue
Write-Host "------------------------------" -ForegroundColor Blue

$healthOk = Test-Endpoint -Url "http://localhost:5000/api/health" -Name "Health Check"

if (-not $healthOk) {
    Write-Host "❌ Server not responding. Make sure to:" -ForegroundColor Red
    Write-Host "   1. cd server" -ForegroundColor Yellow
    Write-Host "   2. npm run dev" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Test metrics endpoint
Write-Host "2️⃣  Real-time Metrics Test" -ForegroundColor Blue
Write-Host "----------------------------" -ForegroundColor Blue

$metricsOk = Test-Endpoint -Url "http://localhost:5000/api/metrics/realtime" -Name "Real-time Metrics"

# Test metrics refresh
Write-Host "3️⃣  Metrics Refresh Test" -ForegroundColor Blue
Write-Host "--------------------------" -ForegroundColor Blue

$refreshOk = Test-Endpoint -Url "http://localhost:5000/api/metrics/refresh" -Name "Metrics Refresh" -Method "POST"

# Test frontend
Write-Host "4️⃣  Frontend Connectivity" -ForegroundColor Blue
Write-Host "---------------------------" -ForegroundColor Blue

try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend: ACCESSIBLE" -ForegroundColor Green
        Write-Host "   Status Code: $($frontendResponse.StatusCode)" -ForegroundColor Gray
        Write-Host "   URL: http://localhost:3000" -ForegroundColor Gray
    }
}
catch {
    Write-Host "❌ Frontend: NOT ACCESSIBLE" -ForegroundColor Red
    Write-Host "   Make sure React app is running: npm start" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "📊 Test Summary" -ForegroundColor Magenta
Write-Host "=================" -ForegroundColor Magenta

$totalTests = 4
$passedTests = 0
if ($healthOk) { $passedTests++ }
if ($metricsOk) { $passedTests++ }
if ($refreshOk) { $passedTests++ }

Write-Host "Tests Passed: $passedTests/$totalTests" -ForegroundColor $(if ($passedTests -eq $totalTests) { "Green" } else { "Yellow" })

if ($passedTests -ge 3) {
    Write-Host "✅ System Status: OPERATIONAL" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Open http://localhost:3000 in your browser"
    Write-Host "2. Try the vulnerability scanner (should work now!)"
    Write-Host "3. Check the dashboard for live metrics"
    Write-Host "4. Monitor real-time threat alerts"
} else {
    Write-Host "❌ System Status: ISSUES DETECTED" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Ensure server is running: cd server && npm run dev"
    Write-Host "2. Check .env file has your API keys"
    Write-Host "3. Verify MongoDB is running"
    Write-Host "4. Check port 5000 is available"
}

Write-Host ""
Write-Host "🔗 Useful Links:" -ForegroundColor Cyan
Write-Host "- Dashboard: http://localhost:3000"
Write-Host "- Health API: http://localhost:5000/api/health"
Write-Host "- Metrics API: http://localhost:5000/api/metrics/realtime"
Write-Host ""

# Check API keys from .env file
Write-Host "5️⃣  API Key Configuration" -ForegroundColor Blue
Write-Host "---------------------------" -ForegroundColor Blue

try {
    $envPath = ".\server\.env"
    if (Test-Path $envPath) {
        $envContent = Get-Content $envPath
        
        $vtKey = ($envContent | Where-Object { $_ -like "VIRUSTOTAL_API_KEY=*" }) -replace "VIRUSTOTAL_API_KEY=", ""
        $shodanKey = ($envContent | Where-Object { $_ -like "SHODAN_API_KEY=*" }) -replace "SHODAN_API_KEY=", ""
        $hibpKey = ($envContent | Where-Object { $_ -like "HIBP_API_KEY=*" }) -replace "HIBP_API_KEY=", ""
        
        Write-Host "VirusTotal API: " -NoNewline -ForegroundColor Gray
        if ($vtKey -and $vtKey -ne "your-virustotal-api-key") {
            Write-Host "✅ CONFIGURED" -ForegroundColor Green
        } else {
            Write-Host "❌ NOT SET" -ForegroundColor Red
        }
        
        Write-Host "Shodan API: " -NoNewline -ForegroundColor Gray
        if ($shodanKey -and $shodanKey -ne "your-shodan-api-key") {
            Write-Host "✅ CONFIGURED" -ForegroundColor Green
        } else {
            Write-Host "❌ NOT SET" -ForegroundColor Red
        }
        
        Write-Host "HIBP API: " -NoNewline -ForegroundColor Gray
        if ($hibpKey -and $hibpKey -ne "your-haveibeenpwned-api-key") {
            Write-Host "✅ CONFIGURED" -ForegroundColor Green
        } else {
            Write-Host "⚠️  NOT SET (paid service)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ .env file not found at $envPath" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Could not read .env file: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Testing complete!" -ForegroundColor Green