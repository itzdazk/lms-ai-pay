#!/usr/bin/env node
// backend/scripts/test-api-simple.js
// Simple test script - chỉ test một số endpoints quan trọng

import newman from 'newman';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure test-results directory exists
const resultsDir = path.join(__dirname, '../test-results');
if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const htmlReportPath = path.join(resultsDir, `newman-report-simple-${timestamp}.html`);
const jsonReportPath = path.join(resultsDir, `newman-report-simple-${timestamp}.json`);

console.log('🧪 Running Simple Postman API tests...\n');
console.log('⚠️  Note: This will test only critical endpoints.\n');

// Test chỉ một số folders quan trọng
const foldersToTest = [
    'Authentication',
    'Health Check'
];

newman.run({
    collection: path.join(__dirname, '../postman/LMS-AI-PAY.postman_collection.json'),
    environment: path.join(__dirname, '../postman/environment.json'),
    folder: foldersToTest, // Test multiple folders
    reporters: ['cli', 'htmlextra', 'json'],
    reporter: {
        htmlextra: {
            export: htmlReportPath
        },
        json: {
            export: jsonReportPath
        }
    },
    iterationCount: 1,
    timeout: 30000,
    timeoutRequest: 10000,
    bail: false,
    color: 'on'
}, (err, summary) => {
    if (err) {
        console.error('❌ Test execution failed:', err);
        process.exit(1);
    }

    console.log('\n📊 Test Summary:');
    console.log(`✅ Total Requests: ${summary.run.stats.requests.total}`);
    console.log(`✅ Passed: ${summary.run.stats.requests.total - summary.run.stats.requests.failed}`);
    console.log(`❌ Failed: ${summary.run.stats.requests.failed}`);
    console.log(`\n📄 HTML Report: ${htmlReportPath}`);
    console.log(`📄 JSON Report: ${jsonReportPath}`);

    if (summary.run.stats.requests.failed > 0) {
        console.log('\n❌ Some tests failed!');
        console.log('\n💡 Tips:');
        console.log('  1. Make sure server is running: npm run dev');
        console.log('  2. Check environment variables in postman/environment.json');
        console.log('  3. Some requests may need authentication tokens');
        process.exit(1);
    } else {
        console.log('\n✅ All tests passed!');
        process.exit(0);
    }
});


