-- Script to create database for LMS AI Pay
-- Run this script with: psql -U postgres -f create-database.sql
-- Or connect to PostgreSQL and run these commands

-- Create database
CREATE DATABASE lms_ai_pay;

-- Optional: Create a dedicated user for the application (recommended for production)
-- CREATE USER lms_user WITH PASSWORD 'your_secure_password_here';
-- GRANT ALL PRIVILEGES ON DATABASE lms_ai_pay TO lms_user;

-- Connect to the new database to verify
\c lms_ai_pay;

-- Show current database
SELECT current_database();

