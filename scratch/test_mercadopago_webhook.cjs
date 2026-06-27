// scratch/test_mercadopago_webhook.cjs – Test script for testing payment notification webhooks and IPN.
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const mockDbPath = path.join(__dirname, 'mock_backend_db.json');
const mockFsPath = path.join(__dirname, 'mock_firestore.json');

// Helpers to write database state
function writeMockDb(data) {
  fs.writeFileSync(mockDbPath, JSON.stringify(data, null, 2));
}

function writeMockFs(data) {
  fs.writeFileSync(mockFsPath, JSON.stringify(data, null, 2));
}

function readMockDb() {
  return JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
}

function readMockFs() {
  return JSON.parse(fs.readFileSync(mockFsPath, 'utf8'));
}

function cleanup() {
  if (fs.existsSync(mockDbPath)) fs.unlinkSync(mockDbPath);
  if (fs.existsSync(mockFsPath)) fs.unlinkSync(mockFsPath);
}

async function runTests() {
  console.log('🧪 Starting Mercado Pago Webhook / IPN Integration Tests...');
  
  // Initialize mock files
  const testUid = 'user_test_123';
  
  const initialDb = {
    users: {
      [testUid]: {
        profile: {
          uid: testUid,
          email: 'test@example.com',
          subscriptionStatus: 'pending_payment',
          activePlan: 'free'
        }
      }
    },
    config: {
      payment_gateways: {
        mercadopagoAccessToken: 'YOUR_MERCADOPAGO_ACCESS_TOKEN' // triggers mock fallback in handleNotification
      },
      plans: {
        premium: {
          name: 'Plan Premium',
          duration: 30,
          durationUnit: 'days',
          price: 100
        },
        pro_1d: {
          name: 'Plan Pro 1d',
          duration: 24,
          durationUnit: 'hours',
          price: 15
        }
      }
    }
  };

  const initialFs = {
    users: {
      [testUid]: {
        subscriptionStatus: 'pending_payment'
      }
    }
  };

  // Re-write database config
  writeMockDb(initialDb);
  writeMockFs(initialFs);

  const paymentService = require('../paymentService.cjs');

  try {
    // ----------------------------------------------------
    // Test Case 1: Webhook Approved Payment (Normal Plan)
    // ----------------------------------------------------
    console.log('\n1. Testing Webhook Approved Payment (Premium)...');
    
    // Simulate a webhook notification payload
    const approvedPayload = {
      type: 'payment',
      id: 'mp-payment-approved-111',
      status: 'approved',
      status_detail: 'accredited',
      external_reference: `${testUid}:premium`
    };

    const resApproved = await paymentService.handleNotification(approvedPayload, {});
    assert.strictEqual(resApproved.success, true, 'Approved notification should return success: true');
    assert.strictEqual(resApproved.status, 'approved', 'Status should be approved');
    assert.strictEqual(resApproved.planId, 'premium', 'PlanId should be premium');

    // Verify DB updates
    const dbState1 = readMockDb();
    const fsState1 = readMockFs();
    
    const userProfile1 = dbState1.users[testUid].profile;
    assert.strictEqual(userProfile1.subscriptionStatus, 'premium', 'RTDB status should be premium');
    assert.strictEqual(userProfile1.activePlan, 'premium', 'RTDB activePlan should be premium');
    assert.strictEqual(userProfile1.transactionId, 'mp-payment-approved-111', 'RTDB transaction ID should be set');
    assert.strictEqual(userProfile1.gateway, 'mercadopago', 'Gateway should be mercadopago');
    assert.ok(userProfile1.activatedAt > 0, 'activatedAt should be set');
    assert.ok(userProfile1.expiresAt > userProfile1.activatedAt, 'expiresAt should be set');
    // Duration check: 30 days = 30 * 24 * 3600 * 1000 = 2592000000 ms
    const diff1 = userProfile1.expiresAt - userProfile1.activatedAt;
    assert.strictEqual(diff1, 2592000000, 'ExpiresAt should be 30 days in the future');

    assert.strictEqual(fsState1.users[testUid].subscriptionStatus, 'premium', 'Firestore status should be premium');
    console.log('  ✅ Webhook Approved Payment test passed.');

    // ----------------------------------------------------
    // Test Case 2: Webhook Rejected Payment
    // ----------------------------------------------------
    console.log('\n2. Testing Webhook Rejected Payment...');
    
    const rejectedPayload = {
      type: 'payment',
      id: 'mp-payment-rejected-222',
      status: 'rejected',
      status_detail: 'cc_rejected_insufficient_amount',
      external_reference: `${testUid}:premium`
    };

    const resRejected = await paymentService.handleNotification(rejectedPayload, {});
    assert.strictEqual(resRejected.success, true, 'Rejected notification should return success: true');
    assert.strictEqual(resRejected.status, 'rejected', 'Status should be rejected');

    const dbState2 = readMockDb();
    const userProfile2 = dbState2.users[testUid].profile;
    assert.strictEqual(userProfile2.subscriptionStatus, 'pending_payment', 'RTDB status should go back to pending_payment');
    assert.strictEqual(userProfile2.paymentRejectedReason, 'cc_rejected_insufficient_amount', 'Rejection reason should be set');
    console.log('  ✅ Webhook Rejected Payment test passed.');

    // ----------------------------------------------------
    // Test Case 3: IPN Notification (Pending Status)
    // ----------------------------------------------------
    console.log('\n3. Testing IPN Notification (Pending Status)...');
    
    const ipnQuery = {
      id: 'mp-payment-pending-333',
      topic: 'payment'
    };
    
    // Simulate query notification where payment is pending
    const pendingPayload = {
      status: 'pending',
      status_detail: 'pending_contingency',
      external_reference: `${testUid}:premium`
    };

    const resPending = await paymentService.handleNotification(pendingPayload, ipnQuery);
    assert.strictEqual(resPending.success, true, 'Pending notification should return success: true');
    assert.strictEqual(resPending.status, 'pending', 'Status should be pending');

    const dbState3 = readMockDb();
    const userProfile3 = dbState3.users[testUid].profile;
    assert.strictEqual(userProfile3.subscriptionStatus, 'pending_validation', 'RTDB status should be pending_validation');
    assert.strictEqual(userProfile3.transactionId, 'mp-payment-pending-333', 'Transaction ID should be set');
    console.log('  ✅ IPN Notification (Pending Status) test passed.');

    // ----------------------------------------------------
    // Test Case 4: Webhook Approved Payment (Bonus Plan)
    // ----------------------------------------------------
    console.log('\n4. Testing Webhook Approved Payment (Bonus)...');
    
    // Setup state where user is already premium
    initialDb.users[testUid].profile.subscriptionStatus = 'premium';
    initialDb.users[testUid].profile.activePlan = 'premium';
    initialDb.users[testUid].profile.extraRequests = 5;
    writeMockDb(initialDb);

    const bonusPayload = {
      type: 'payment',
      id: 'mp-payment-approved-444',
      status: 'approved',
      status_detail: 'accredited',
      external_reference: `${testUid}:bonus`
    };

    const resBonus = await paymentService.handleNotification(bonusPayload, {});
    assert.strictEqual(resBonus.success, true, 'Bonus notification should return success: true');
    assert.strictEqual(resBonus.planId, 'bonus', 'PlanId should be bonus');

    const dbState4 = readMockDb();
    const userProfile4 = dbState4.users[testUid].profile;
    
    // Premium user gets +20 requests
    assert.strictEqual(userProfile4.subscriptionStatus, 'premium', 'Active plan should remain premium');
    assert.strictEqual(userProfile4.extraRequests, 25, 'Extra requests should be 5 + 20 = 25');
    assert.ok(userProfile4.extraRequestsExpiresAt > Date.now(), 'Extra requests expiry should be set');
    console.log('  ✅ Webhook Approved Payment (Bonus) test passed.');

    // ----------------------------------------------------
    // Test Case 5: 1-Day Pro Plan Activation
    // ----------------------------------------------------
    console.log('\n5. Testing 1-Day Pro Plan (pro_1d) Activation...');
    
    const pro1dPayload = {
      type: 'payment',
      id: 'mp-payment-approved-555',
      status: 'approved',
      status_detail: 'accredited',
      external_reference: `${testUid}:pro_1d`
    };

    const resPro1d = await paymentService.handleNotification(pro1dPayload, {});
    assert.strictEqual(resPro1d.success, true, 'Pro_1d notification should return success: true');

    const dbState5 = readMockDb();
    const userProfile5 = dbState5.users[testUid].profile;
    assert.strictEqual(userProfile5.subscriptionStatus, 'pro_1d', 'RTDB status should be pro_1d');
    const diff5 = userProfile5.expiresAt - userProfile5.activatedAt;
    // 24 hours = 24 * 3600 * 1000 = 86400000 ms
    assert.strictEqual(diff5, 86400000, 'ExpiresAt should be exactly 24 hours in the future');
    assert.strictEqual(userProfile5.pro1dUsed, true, 'pro1dUsed should be set to true');
    console.log('  ✅ 1-Day Pro Plan (pro_1d) Activation test passed.');

    console.log('\n🎉 ALL WEBHOOK/IPN NOTIFICATION INTEGRATION TESTS PASSED!');
    cleanup();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ WEBHOOK/IPN INTEGRATION TEST FAILURE:', err);
    cleanup();
    process.exit(1);
  }
}

runTests();
