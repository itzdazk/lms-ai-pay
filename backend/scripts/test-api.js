#!/usr/bin/env node
// backend/scripts/test-api.js

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
const htmlReportPath = path.join(resultsDir, `newman-report-${timestamp}.html`);
const jsonReportPath = path.join(resultsDir, `newman-report-${timestamp}.json`);

console.log('🧪 Running Postman API tests...\n');

newman.run({
    collection: path.join(__dirname, '../postman/LMS-AI-PAY-NEW.postman_collection.json'),
    environment: path.join(__dirname, '../postman/environment.json'),
    reporters: ['cli', 'htmlextra', 'json'],
    reporter: {
        htmlextra: {
            export: htmlReportPath,
            template: './node_modules/newman-reporter-htmlextra/lib/template.hbs',
            logs: true,
            showOnlyFails: false,
            testPaging: true,
            browserTitle: 'LMS AI Pay - API Test Results',
            title: 'LMS AI Pay API Test Report',
            omitRequestHeaders: false,
            omitResponseHeaders: false,
            hideRequestBody: false,
            hideResponseBody: false,
            showEnvironmentData: true,
            skipEnvironmentVars: [],
            skipGlobalVars: [],
            omitRequestBodies: false,
            omitResponseBodies: false,
            omitRequestHeaders: false,
            omitResponseHeaders: false
        },
        json: {
            export: jsonReportPath
        }
    },
    iterationCount: 1,
    timeout: 30000,
    timeoutRequest: 10000,
    bail: false, // Continue on failure
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

    // Exit with error code if tests failed
    if (summary.run.stats.requests.failed > 0) {
        console.log('\n❌ Some tests failed!');
        process.exit(1);
    } else {
        console.log('\n✅ All tests passed!');
        process.exit(0);
    }
});

