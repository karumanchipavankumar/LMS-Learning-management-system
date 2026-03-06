$adminUser = "admin@lms.com"
$adminPass = "admin123"
$baseUrl = "http://localhost:8080"

Write-Host "1. Login..."
$loginBody = @{
    username = $adminUser
    password = $adminPass
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "Login Successful! Token: $token" -ForegroundColor Green
} catch {
    Write-Host "Login Failed: $_" -ForegroundColor Red
    exit
}

Write-Host "`n2. Seeding Enrollments..."
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    Invoke-RestMethod -Uri "$baseUrl/admin/seed-enrollments" -Method Post -Headers $headers
    Write-Host "Seeding Successful!" -ForegroundColor Green
} catch {
    Write-Host "Seeding Failed: $_" -ForegroundColor Red
}
