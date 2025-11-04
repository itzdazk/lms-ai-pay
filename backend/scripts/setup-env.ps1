# PowerShell script to create .env file
# Usage: .\setup-env.ps1

Write-Host "🔧 Setting up .env file for backend..." -ForegroundColor Cyan

$envPath = Join-Path $PSScriptRoot "..\.env"

if (Test-Path $envPath) {
    Write-Host "⚠️  File .env already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Aborted." -ForegroundColor Red
        exit 0
    }
}

# Get PostgreSQL credentials
Write-Host "`n📝 Enter PostgreSQL credentials:" -ForegroundColor Yellow
$dbUsername = Read-Host "PostgreSQL username (default: postgres)"
if ([string]::IsNullOrWhiteSpace($dbUsername)) {
    $dbUsername = "postgres"
}

$dbPassword = Read-Host "PostgreSQL password" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

$dbHost = Read-Host "PostgreSQL host (default: localhost)"
if ([string]::IsNullOrWhiteSpace($dbHost)) {
    $dbHost = "localhost"
}

$dbPort = Read-Host "PostgreSQL port (default: 5432)"
if ([string]::IsNullOrWhiteSpace($dbPort)) {
    $dbPort = "5432"
}

$databaseName = Read-Host "Database name (default: lms_ai_pay)"
if ([string]::IsNullOrWhiteSpace($databaseName)) {
    $databaseName = "lms_ai_pay"
}

# Generate JWT Secret
Write-Host "`n🔐 Generating JWT secret..." -ForegroundColor Yellow
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Create .env content
$envContent = @"
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://$dbUsername`:$dbPasswordPlain@$dbHost`:$dbPort/$databaseName`?schema=public"

# JWT
JWT_SECRET=$jwtSecret
JWT_EXPIRES_IN=7d

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=noreply@lmsaipay.com

# OpenAI API
OPENAI_API_KEY=

# Payment Gateways (sẽ setup sau)
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5000/api/payments/vnpay/callback

MOMO_PARTNER_CODE=
MOMO_ACCESS_KEY=
MOMO_SECRET_KEY=
MOMO_API_URL=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_RETURN_URL=http://localhost:5000/api/payments/momo/callback

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,gif,webp
ALLOWED_VIDEO_TYPES=mp4,webm,mov

# Frontend URL
FRONTEND_URL=http://localhost:3000
"@

# Write to file
try {
    Set-Content -Path $envPath -Value $envContent -Encoding UTF8
    Write-Host "✅ File .env created successfully at: $envPath" -ForegroundColor Green
    Write-Host "`n📝 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Run: npm run prisma:migrate" -ForegroundColor White
    Write-Host "   2. Run: npm run prisma:seed (optional)" -ForegroundColor White
    Write-Host "   3. Run: npm run dev" -ForegroundColor White
} catch {
    Write-Host "❌ Error creating .env file: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clear password from memory
    $dbPasswordPlain = ""
}







