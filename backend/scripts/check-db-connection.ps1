# Script to check PostgreSQL connection and list users
Write-Host "🔍 Checking PostgreSQL connection..." -ForegroundColor Cyan

$username = Read-Host "Enter PostgreSQL username to test (default: postgres)"
if ([string]::IsNullOrWhiteSpace($username)) {
    $username = "postgres"
}

$password = Read-Host "Enter password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

Write-Host "`nTesting connection..." -ForegroundColor Yellow

$env:PGPASSWORD = $passwordPlain

try {
    # Test connection
    $result = & psql -U $username -d postgres -c "SELECT version();" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Connection successful!" -ForegroundColor Green
        Write-Host "`nListing users..." -ForegroundColor Yellow
        
        # List users
        & psql -U $username -d postgres -c "\du" 2>&1
        
        Write-Host "`nListing databases..." -ForegroundColor Yellow
        & psql -U $username -d postgres -c "\l" 2>&1 | Select-String "lms_ai_pay"
        
        Write-Host "`n📝 Suggested DATABASE_URL:" -ForegroundColor Cyan
        Write-Host "DATABASE_URL=`"postgresql://$username`:xxxxx@localhost:5432/lms_ai_pay?schema=public`"" -ForegroundColor White
        Write-Host "   (Replace xxxxx with your password)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Connection failed!" -ForegroundColor Red
        Write-Host "Please check:" -ForegroundColor Yellow
        Write-Host "  1. Username and password are correct" -ForegroundColor White
        Write-Host "  2. PostgreSQL service is running" -ForegroundColor White
        Write-Host "  3. PostgreSQL port is 5432" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
} finally {
    $env:PGPASSWORD = ""
    $passwordPlain = ""
}







