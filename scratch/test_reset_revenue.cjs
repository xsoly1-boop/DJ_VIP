const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const mockBackendDbPath = path.join(__dirname, 'mock_backend_db.json');
const mockFirestorePath = path.join(__dirname, 'mock_firestore.json');

// Initialize mock DBs with some active premium subscriptions
fs.writeFileSync(mockBackendDbPath, JSON.stringify({
  users: {
    "user-1": {
      profile: {
        email: "premium@dj.com",
        displayName: "Premium DJ",
        subscriptionStatus: "premium",
        activePlan: "premium",
        selectedPlan: "premium",
        expiresAt: Date.now() + 10000000,
        gateway: "paypal",
        transactionId: "TX123",
        extraRequests: 15,
        extraRequestsExpiresAt: Date.now() + 10000000
      }
    },
    "user-2": {
      profile: {
        email: "vip@dj.com",
        displayName: "VIP DJ",
        subscriptionStatus: "vip",
        activePlan: "vip",
        selectedPlan: "vip",
        expiresAt: 0
      }
    }
  },
  pending_subscriptions: {
    "user-1": {
      plan: "premium",
      gateway: "paypal"
    }
  }
}, null, 2));

fs.writeFileSync(mockFirestorePath, JSON.stringify({
  users: {
    "user-1": {
      subscriptionStatus: "premium"
    },
    "user-2": {
      subscriptionStatus: "vip"
    }
  }
}, null, 2));

process.env.VITE_ADMIN_MASTER_SECRET = "testsecret123";
process.env.PORT = "4002";

const adminRoutes = require('../adminRoutes.cjs');

const app = express();
app.use(bodyParser.json());
app.use('/api/admin', adminRoutes);

const server = app.listen(4002, async () => {
  console.log("🧪 Test server for resetRevenue listening on port 4002");
  try {
    // 1. Call resetRevenue
    const res = await fetch("http://localhost:4002/api/admin/resetRevenue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: "testsecret123"
      })
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(`Failed to reset: ${data.error}`);
    }
    console.log("  ✅ resetRevenue API returned success.");

    // 2. Verify results
    const backendData = JSON.parse(fs.readFileSync(mockBackendDbPath, 'utf8'));
    const firestoreData = JSON.parse(fs.readFileSync(mockFirestorePath, 'utf8'));

    // Check Realtime Database profile reset
    const p1 = backendData.users["user-1"].profile;
    if (p1.activePlan !== "free" || p1.subscriptionStatus !== "free" || p1.selectedPlan !== "free" || p1.expiresAt !== 0 || p1.gateway !== null || p1.extraRequests !== 0 || p1.extraRequestsExpiresAt !== 0) {
      throw new Error(`User-1 profile was not reset correctly: ${JSON.stringify(p1)}`);
    }
    const p2 = backendData.users["user-2"].profile;
    if (p2.activePlan !== "free" || p2.subscriptionStatus !== "free" || p2.selectedPlan !== "free") {
      throw new Error(`User-2 profile was not reset correctly: ${JSON.stringify(p2)}`);
    }
    console.log("  ✅ Realtime Database profiles verified.");

    // Check pending_subscriptions removed
    if (backendData.pending_subscriptions !== undefined) {
      throw new Error("pending_subscriptions node was not removed");
    }
    console.log("  ✅ pending_subscriptions deletion verified.");

    // Check Firestore status reset
    if (firestoreData.users["user-1"].subscriptionStatus !== "free" || firestoreData.users["user-2"].subscriptionStatus !== "free") {
      throw new Error("Firestore subscriptionStatus was not reset to free");
    }
    console.log("  ✅ Firestore collection verified.");

    console.log("🎉 ALL RESET REVENUE TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Test failed:", err);
    process.exit(1);
  }
});
