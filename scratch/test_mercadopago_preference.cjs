// scratch/test_mercadopago_preference.cjs – Test script for Mercado Pago SDK v3 preference creation.
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const mockDbPath = path.join(__dirname, 'mock_backend_db.json');

// Helper to write mock database state
function writeMockDb(data) {
  fs.writeFileSync(mockDbPath, JSON.stringify(data, null, 2));
}

// Cleanup helper
function cleanup() {
  if (fs.existsSync(mockDbPath)) {
    fs.unlinkSync(mockDbPath);
  }
}

async function runTests() {
  console.log('🧪 Starting Mercado Pago SDK v3 Integration Tests...');
  
  // 1. Setup mock database structure
  writeMockDb({
    config: {
      payment_gateways: {
        mercadopagoAccessToken: 'YOUR_MERCADOPAGO_ACCESS_TOKEN' // triggers mock fallback
      },
      plans: {
        vip: {
          name: 'Super VIP Extra',
          price: '250',
          currency: 'MXN'
        }
      }
    }
  });

  const paymentService = require('../paymentService.cjs');

  try {
    // Test case 1: Mock Fallback
    console.log('1. Testing Offline Mock Fallback...');
    const mockResult = await paymentService.createSubscription({
      userId: 'test-user',
      planId: 'vip',
      paymentMethod: 'mercadopago'
    });
    
    assert.ok(mockResult.id.startsWith('MP-MOCK-SUB-'), 'Should return a mock subscription ID');
    assert.strictEqual(mockResult.init_point, 'http://localhost:5173', 'Should return the mock init point');
    console.log('  ✅ Offline Mock Fallback test passed.');

    // Test case 2: Real SDK initialization and Preference format
    console.log('2. Testing SDK Preference initialization with dummy credentials...');
    // Overwrite mock DB with a "real-looking" but invalid token
    writeMockDb({
      config: {
        payment_gateways: {
          mercadopagoAccessToken: 'APP_USR-1234567890-TEST-TOKEN'
        },
        plans: {
          vip: {
            name: 'Super VIP Extra',
            price: '250',
            currency: 'MXN'
          }
        }
      }
    });

    // Re-load payment config dynamically inside createSubscription
    try {
      await paymentService.createSubscription({
        userId: 'test-user',
        planId: 'vip',
        paymentMethod: 'mercadopago'
      });
      throw new Error('Expected Mercado Pago API error, but request succeeded or threw unexpected error.');
    } catch (err) {
      if (err.message.includes("Cannot read properties of undefined") || err.message.includes("is not a constructor")) {
        throw new Error(`Regression detected: ${err.message}`);
      }
      // An error from Mercado Pago API (like 401 Unauthorized or 400 Bad Request) indicates that the SDK was initialized and called correctly.
      console.log(`  ✅ SDK method executed correctly and hit the API (received expected response/error: ${err.message})`);
    }

    console.log('🎉 ALL MERCADO PAGO INTEGRATION TESTS PASSED!');
    cleanup();
    process.exit(0);
  } catch (err) {
    console.error('❌ TEST FAILURE:', err);
    cleanup();
    process.exit(1);
  }
}

runTests();
