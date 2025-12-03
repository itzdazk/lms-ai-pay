#!/usr/bin/env node
// backend/scripts/test-module.js

import newman from 'newman';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const moduleName = process.argv[2];

if (!moduleName) {
    console.error('Usage: node scripts/test-module.js <module-name>');
    console.error('Example: node scripts/test-module.js "Authentication"');
    process.exit(1);
}

console.log(`🧪 Testing module: ${moduleName}\n`);

newman.run({
    collection: path.join(__dirname, '../postman/LMS-AI-PAY.postman_collection.json'),
    environment: path.join(__dirname, '../postman/environment.json'),
    folder: moduleName,
    reporters: ['cli'],
    bail: false
}, (err, summary) => {
    if (err) {
        console.error('❌ Test execution failed:', err);
        process.exit(1);
    }

    console.log('\n📊 Test Summary:');
    console.log(`✅ Total Requests: ${summary.run.stats.requests.total}`);
    console.log(`✅ Passed: ${summary.run.stats.requests.total - summary.run.stats.requests.failed}`);
    console.log(`❌ Failed: ${summary.run.stats.requests.failed}`);

    if (summary.run.stats.requests.failed > 0) {
        console.log('\n❌ Some tests failed!');
        process.exit(1);
    } else {
        console.log('\n✅ All tests passed!');
        process.exit(0);
    }
});


