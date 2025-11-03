@echo off
REM Batch script to create PostgreSQL database for LMS AI Pay
REM Usage: create-database.bat

echo Creating PostgreSQL database for LMS AI Pay...

set /p USERNAME="Enter PostgreSQL username (default: postgres): "
if "%USERNAME%"=="" set USERNAME=postgres

set /p PASSWORD="Enter PostgreSQL password: "

set DATABASE_NAME=lms_ai_pay

echo.
echo Attempting to create database: %DATABASE_NAME%

set PGPASSWORD=%PASSWORD%
psql -U %USERNAME% -d postgres -c "CREATE DATABASE %DATABASE_NAME%;"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Database '%DATABASE_NAME%' created successfully!
    echo.
    echo Next steps:
    echo   1. Create backend/.env file with DATABASE_URL
    echo   2. Run: npm run prisma:migrate
    echo   3. Run: npm run prisma:seed (optional)
) else (
    echo.
    echo Failed to create database. Please check:
    echo   1. PostgreSQL is running
    echo   2. Username and password are correct
    echo   3. You have permission to create databases
)

set PGPASSWORD=



