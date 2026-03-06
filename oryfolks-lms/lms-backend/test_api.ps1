$adminUser = "admin@lms.com"
$adminPass = "admin123"
$baseUrl = "http://localhost:8080"

Write-Host "1. Testing Login..."
$loginBody = @{
    username = $adminUser
    password = $adminPass
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login Successful! Token received." -ForegroundColor Green
} catch {
    Write-Host "Login Failed: $_" -ForegroundColor Red
    exit
}

Write-Host "`n2. Testing Admin Dashboard Summary..."
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    $dashboardResponse = Invoke-RestMethod -Uri "$baseUrl/admin/dashboard/summary" -Method Get -Headers $headers
    Write-Host "Dashboard Summary Fetch Successful!" -ForegroundColor Green
    Write-Host "Published Courses: $($dashboardResponse.publishedCount)"
    Write-Host "Assigned Courses: $($dashboardResponse.assignedCount)"
} catch {
    Write-Host "Dashboard Fetch Failed: $_" -ForegroundColor Red
}

Write-Host "`n3. Testing Manager Team (as Admin - expected 403 or 404 if role check works)..."
try {
   Invoke-RestMethod -Uri "$baseUrl/manager/my-team" -Method Get -Headers $headers
} catch {
    Write-Host "Manager Route Access Forbidden (Expected for Admin): $_" -ForegroundColor Yellow
}
