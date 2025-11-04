# PowerShell script to create PostgreSQL database
# Usage: .\create-database.ps1

Write-Host "🗄️  Creating PostgreSQL database for LMS AI Pay..." -ForegroundColor Cyan

# Prompt for PostgreSQL username (default: postgres)
$username = Read-Host "Enter PostgreSQL username (default: postgres)"
if ([string]::IsNullOrWhiteSpace($username)) {
    $username = "postgres"
}

# Prompt for PostgreSQL password
$securePassword = Read-Host "Enter PostgreSQL password" -AsSecureString
$password = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
)

# Database name
$databaseName = "lms_ai_pay"

Write-Host "`nAttempting to create database: $databaseName" -ForegroundColor Yellow

# Create database using psql
$env:PGPASSWORD = $password
$createDbQuery = "CREATE DATABASE $databaseName;"

try {
    # Check if database already exists
    $checkQuery = "SELECT 1 FROM pg_database WHERE datname = '$databaseName';"
    $result = & psql -U $username -d postgres -t -c $checkQuery 2>&1
    
    if ($result -match "1") {
        Write-Host "⚠️  Database '$databaseName' already exists!" -ForegroundColor Yellow
        $overwrite = Read-Host "Do you want to drop and recreate it? (y/N)"
        if ($overwrite -eq "y" -or $overwrite -eq "Y") {
            Write-Host "Dropping existing database..." -ForegroundColor Yellow
            & psql -U $username -d postgres -c "DROP DATABASE IF EXISTS $databaseName;" 2>&1 | Out-Null
            Write-Host "Creating new database..." -ForegroundColor Yellow
            & psql -U $username -d postgres -c $createDbQuery 2>&1 | Out-Null
            Write-Host "✅ Database '$databaseName' created successfully!" -ForegroundColor Green
        } else {
            Write-Host "✅ Using existing database '$databaseName'" -ForegroundColor Green
        }
    } else {
        Write-Host "Creating database..." -ForegroundColor Yellow
        & psql -U $username -d postgres -c $createDbQuery 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database '$databaseName' created successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to create database. Please check your PostgreSQL credentials." -ForegroundColor Red
            exit 1
        }
    }
    
    # Verify database exists
    Write-Host "`nVerifying database..." -ForegroundColor Yellow
    $verifyQuery = "SELECT datname FROM pg_database WHERE datname = '$databaseName';"
    $verifyResult = & psql -U $username -d postgres -t -c $verifyQuery 2>&1
    
    if ($verifyResult -match $databaseName) {
        Write-Host "✅ Database verification successful!" -ForegroundColor Green
        Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
        Write-Host "   1. Create backend/.env file with DATABASE_URL" -ForegroundColor White
        Write-Host "   2. Run: npm run prisma:migrate" -ForegroundColor White
        Write-Host "   3. Run: npm run prisma:seed (optional)" -ForegroundColor White
    } else {
        Write-Host "⚠️  Could not verify database creation" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host "`nPlease make sure:" -ForegroundColor Yellow
    Write-Host "   1. PostgreSQL is running" -ForegroundColor White
    Write-Host "   2. psql is in your PATH" -ForegroundColor White
    Write-Host "   3. Username and password are correct" -ForegroundColor White
    exit 1
} finally {
    # Clear password from environment
    $env:PGPASSWORD = ""
    $password = ""
}







