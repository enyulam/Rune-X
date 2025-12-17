# Rune-X Platform End-to-End Test Script
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Rune-X Platform Test Suite" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Backend Health Check
Write-Host "[Test 1] Backend Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -UseBasicParsing -TimeoutSec 5
    $health = $response.Content | ConvertFrom-Json
    Write-Host "  [PASS] Backend is healthy" -ForegroundColor Green
    Write-Host "    Status: $($health.status)" -ForegroundColor Gray
    Write-Host "    Message: $($health.message)" -ForegroundColor Gray
} catch {
    Write-Host "  [FAIL] Backend health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Frontend Accessibility
Write-Host ""
Write-Host "[Test 2] Frontend Accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "  [PASS] Frontend is accessible" -ForegroundColor Green
    Write-Host "    Status Code: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "  [FAIL] Frontend not accessible: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: API Documentation
Write-Host ""
Write-Host "[Test 3] API Documentation..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/docs" -UseBasicParsing -TimeoutSec 5
    Write-Host "  [PASS] API documentation is accessible" -ForegroundColor Green
    Write-Host "    URL: http://127.0.0.1:8000/docs" -ForegroundColor Gray
} catch {
    Write-Host "  [FAIL] API docs not accessible: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: API Endpoints Available
Write-Host ""
Write-Host "[Test 4] API Endpoints Check..." -ForegroundColor Yellow
$endpoints = @(
    @{Path="/health"; Method="GET"; Name="Health Check"},
    @{Path="/process"; Method="POST"; Name="Process Image"},
    @{Path="/results/test-id"; Method="GET"; Name="Get Results"}
)

foreach ($endpoint in $endpoints) {
    try {
        if ($endpoint.Method -eq "GET") {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000$($endpoint.Path)" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            Write-Host "  [OK] $($endpoint.Name) - $($endpoint.Method) $($endpoint.Path)" -ForegroundColor Green
        } else {
            # For POST, just check if endpoint exists (will fail with 422, but that's expected)
            try {
                $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000$($endpoint.Path)" -Method POST -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            } catch {
                if ($_.Exception.Response.StatusCode.value__ -eq 422) {
                    Write-Host "  [OK] $($endpoint.Name) - $($endpoint.Method) $($endpoint.Path) (endpoint exists)" -ForegroundColor Green
                } else {
                    throw
                }
            }
        }
    } catch {
        if ($endpoint.Path -eq "/results/test-id" -and $_.Exception.Response.StatusCode.value__ -eq 404) {
            Write-Host "  [OK] $($endpoint.Name) - $($endpoint.Method) $($endpoint.Path) (endpoint exists)" -ForegroundColor Green
        } else {
            Write-Host "  [WARN] $($endpoint.Name) - $($endpoint.Method) $($endpoint.Path) - $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

# Summary
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend: http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  - Health: /health" -ForegroundColor Gray
Write-Host "  - Process: /process (POST)" -ForegroundColor Gray
Write-Host "  - Results: /results/{image_id} (GET)" -ForegroundColor Gray
Write-Host "  - Docs: /docs" -ForegroundColor Gray
Write-Host ""
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  - Main page with upload interface" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "  2. Upload a Chinese text image (PNG, JPG, etc.)" -ForegroundColor White
Write-Host "  3. Wait for processing to complete" -ForegroundColor White
Write-Host "  4. Verify results show:" -ForegroundColor White
Write-Host "     - Extracted Chinese text" -ForegroundColor Gray
Write-Host "     - Character breakdown (pinyin, meaning, confidence)" -ForegroundColor Gray
Write-Host "     - Full sentence translation" -ForegroundColor Gray
Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan

