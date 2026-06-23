// Test for admin subscription updates.
// Verifies that updates propagate to both Firestore and Realtime Database mock stores.
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const mockBackendDbPath = path.join(__dirname, 'mock_backend_db.json');
const mockFirestorePath = path.join(__dirname, 'mock_firestore.json');

// Initialize empty mock DBs
fs.writeFileSync(mockBackendDbPath, JSON.stringify({
  users: {
    "test-user-123": {
      profile: {
        email: "test@dj.com",
        displayName: "Test DJ",
        subscriptionStatus: "free"
      }
    }
  }
}, null, 2));

fs.writeFileSync(mockFirestorePath, JSON.stringify({
  subscriptions: {
    "sub-abc": {
      uid: "test-user-123",
      plan: "free",
      status: "active"
    }
  },
  users: {
    "test-user-123": {
      subscriptionStatus: "free"
    }
  }
}, null, 2));

// Set up environment for the test
process.env.VITE_ADMIN_MASTER_SECRET = "testsecret123";
process.env.PORT = "4001";

// Import server/routes
const adminRoutes = require('../adminRoutes.cjs');

const app = express();
app.use(bodyParser.json());
app.use('/api/admin', adminRoutes);

const server = app.listen(4001, async () => {
  console.log("🧪 Test server listening on port 4001");
  try {
    // 1. Test updateUserSubscriptionStatus
    console.log("1. Testing /updateUserSubscriptionStatus...");
    const res1 = await fetch("http://localhost:4001/api/admin/updateUserSubscriptionStatus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: "test-user-123",
        secret: "testsecret123",
        status: "premium"
      })
    });
    const data1 = await res1.json();
    if (!data1.success) {
      throw new Error(`Failed to update status: ${data1.error}`);
    }
    console.log("  ✅ API returned success.");

    // Verify mock files
    const firestoreData = JSON.parse(fs.readFileSync(mockFirestorePath, 'utf8'));
    const backendData = JSON.parse(fs.readFileSync(mockBackendDbPath, 'utf8'));

    // Check Firestore
    if (firestoreData.users["test-user-123"].subscriptionStatus !== "premium") {
      throw new Error("Firestore subscriptionStatus was not updated to premium");
    }
    console.log("  ✅ Firestore status verified.");

    // Check Realtime Database
    const profile = backendData.users["test-user-123"].profile;
    if (profile.subscriptionStatus !== "premium" || profile.activePlan !== "premium" || profile.selectedPlan !== "premium") {
      throw new Error("Realtime Database profile plans were not updated to premium");
    }
    if (!profile.expiresAt || profile.expiresAt <= Date.now()) {
      throw new Error("Realtime Database profile expiresAt was not calculated/set");
    }
    console.log("  ✅ Realtime Database status, activePlan, selectedPlan and expiresAt verified.");

    // 2. Test updateSubscription
    console.log("2. Testing /updateSubscription...");
    const res2 = await fetch("http://localhost:4001/api/admin/updateSubscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscriptionId: "sub-abc",
        secret: "testsecret123",
        updates: {
          plan: "vip"
        }
      })
    });
    const data2 = await res2.json();
    if (!data2.success) {
      throw new Error(`Failed to update subscription: ${data2.error}`);
    }
    console.log("  ✅ API returned success.");

    // Verify mock files
    const firestoreData2 = JSON.parse(fs.readFileSync(mockFirestorePath, 'utf8'));
    const backendData2 = JSON.parse(fs.readFileSync(mockBackendDbPath, 'utf8'));

    // Check Firestore
    if (firestoreData2.subscriptions["sub-abc"].plan !== "vip") {
      throw new Error("Firestore subscription plan was not updated to vip");
    }
    console.log("  ✅ Firestore subscription plan verified.");

    // Check Realtime Database
    const profile2 = backendData2.users["test-user-123"].profile;
    if (profile2.subscriptionStatus !== "vip" || profile2.activePlan !== "vip" || profile2.selectedPlan !== "vip") {
      throw new Error("Realtime Database profile was not updated to vip");
    }
    console.log("  ✅ Realtime Database profile sync verified.");

    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
    cleanupAndExit(0);
  } catch (err) {
    console.error("❌ TEST FAILED:", err.message);
    cleanupAndExit(1);
  }
});

function cleanupAndExit(code) {
  server.close(() => {
    // Delete temporary test mock DB files to avoid side effects
    try {
      if (fs.existsSync(mockBackendDbPath)) fs.unlinkSync(mockBackendDbPath);
      if (fs.existsSync(mockFirestorePath)) fs.unlinkSync(mockFirestorePath);
    } catch (e) {}
    process.exit(code);
  });
}
