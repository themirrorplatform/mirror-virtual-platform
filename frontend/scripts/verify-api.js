/**
 * API Endpoint Verification
 * Tests connectivity to backend APIs for Phase 1 integration
 */

// Run with: node scripts/verify-api.js
// Or in browser console at localhost:3000

const API_BASE = 'http://localhost:8000';

const endpoints = [
  // Reflection endpoints
  {
    name: 'Create Reflection',
    method: 'POST',
    url: `${API_BASE}/v1/reflect`,
    body: {
      content: 'Test reflection for API verification',
      layer: 'Sovereign',
    },
    expectedStatus: [200, 201, 401], // 401 if auth required
  },
  
  // Identity endpoints
  {
    name: 'Identity Graph',
    method: 'GET',
    url: `${API_BASE}/v1/identity/graph`,
    expectedStatus: [200, 401],
  },
  {
    name: 'Identity Graph (Time-Travel)',
    method: 'GET',
    url: `${API_BASE}/v1/identity/graph?at=2024-01-01T00:00:00Z`,
    expectedStatus: [200, 401],
  },
  
  // Governance endpoints
  {
    name: 'List Proposals',
    method: 'GET',
    url: `${API_BASE}/api/governance/proposals`,
    expectedStatus: [200, 401],
  },
  {
    name: 'List Guardians',
    method: 'GET',
    url: `${API_BASE}/api/governance/guardians`,
    expectedStatus: [200, 401],
  },
  
  // Analytics endpoints (future)
  {
    name: 'Analytics Overview',
    method: 'GET',
    url: `${API_BASE}/api/analytics/overview`,
    expectedStatus: [200, 401, 404], // 404 if not implemented yet
  },
  
  // Health check
  {
    name: 'Health Check',
    method: 'GET',
    url: `${API_BASE}/health`,
    expectedStatus: [200],
  },
];

async function verifyEndpoint(endpoint) {
  const { name, method, url, body, expectedStatus } = endpoint;
  
  try {
    console.log(`\n🔍 Testing: ${name}`);
    console.log(`   ${method} ${url}`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const startTime = Date.now();
    const response = await fetch(url, options);
    const duration = Date.now() - startTime;
    
    const status = response.status;
    const isExpected = expectedStatus.includes(status);
    
    if (isExpected) {
      console.log(`   ✅ ${status} ${response.statusText} (${duration}ms)`);
      
      // Try to parse response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const data = await response.json();
          console.log(`   📦 Response:`, JSON.stringify(data).slice(0, 100) + '...');
        } catch (e) {
          console.log(`   📦 Response: (JSON parse error)`);
        }
      }
    } else {
      console.log(`   ❌ ${status} ${response.statusText} (expected: ${expectedStatus.join(' or ')})`);
    }
    
    return { name, status, isExpected, duration };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { name, status: 'ERROR', isExpected: false, error: error.message };
  }
}

async function verifyAll() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Mirror Virtual Platform - API Verification');
  console.log('═══════════════════════════════════════════════════');
  console.log(`\n🎯 Target: ${API_BASE}`);
  console.log(`📊 Testing ${endpoints.length} endpoints...\n`);
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await verifyEndpoint(endpoint);
    results.push(result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Summary');
  console.log('═══════════════════════════════════════════════════');
  
  const passed = results.filter(r => r.isExpected).length;
  const failed = results.filter(r => !r.isExpected).length;
  
  console.log(`\n✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\n⚠️  Failed endpoints:');
    results
      .filter(r => !r.isExpected)
      .forEach(r => console.log(`   - ${r.name} (${r.status})`));
  }
  
  // Next steps
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Next Steps');
  console.log('═══════════════════════════════════════════════════\n');
  
  if (failed === 0) {
    console.log('🎉 All endpoints responding correctly!');
    console.log('✅ Frontend can communicate with backend');
    console.log('🚀 Ready to proceed with full testing');
  } else {
    console.log('❌ Some endpoints are not responding as expected');
    console.log('');
    console.log('Possible causes:');
    console.log('1. Backend server not running');
    console.log('   → Start with: cd core-api && uvicorn app.main:app --reload');
    console.log('2. Authentication required (401 errors)');
    console.log('   → Login first at /login or use token in headers');
    console.log('3. Endpoints not implemented yet (404 errors)');
    console.log('   → Check backend router files');
    console.log('4. CORS issues');
    console.log('   → Check CORS middleware in backend');
  }
  
  console.log('\n═══════════════════════════════════════════════════\n');
}

// Run if in Node.js
if (typeof module !== 'undefined' && module.exports) {
  verifyAll();
}

// Export for browser usage
if (typeof window !== 'undefined') {
  window.verifyAPI = verifyAll;
  console.log('✅ API verification loaded. Run: verifyAPI()');
}
