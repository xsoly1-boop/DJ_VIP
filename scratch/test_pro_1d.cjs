// Test for Pro x 1 Día plan lifecycle and metadata updates.
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const mockBackendDbPath = path.join(__dirname, 'mock_backend_db.json');
const mockFirestorePath = path.join(__dirname, 'mock_firestore.json');

// Initialize empty mock DBs
fs.writeFileSync(mockBackendDbPath, JSON.stringify({
  users: {
    "test-user-vip": {
      profile: {
        email: "vip@dj.com",
        displayName: "VIP DJ",
        subscriptionStatus: "vip",
        activePlan: "vip",
        selectedPlan: "vip"
      }
    },
    "test-user-free": {
      profile: {
        email: "free@dj.com",
        displayName: "Free DJ",
        subscriptionStatus: "free",
        activePlan: "free",
        selectedPlan: "free"
      }
    }
  }
}, null, 2));

fs.writeFileSync(mockFirestorePath, JSON.stringify({
  users: {
    "test-user-vip": {
      subscriptionStatus: "vip"
    },
    "test-user-free": {
      subscriptionStatus: "free"
    }
  }
}, null, 2));

// Set up environment for the test
process.env.VITE_ADMIN_MASTER_SECRET = "testsecret123";
process.env.PORT = "4004";

// Import server/routes
const adminRoutes = require('../adminRoutes.cjs');

const app = express();
app.use(bodyParser.json());
app.use('/api/admin', adminRoutes);

const server = app.listen(4004, async () => {
  console.log("🧪 Pro 1 Day Test server listening on port 4004");
  try {
    // 1. Upgrade VIP DJ to pro_1d
    console.log("1. Upgrading VIP user to pro_1d...");
    const res1 = await fetch("http://localhost:4004/api/admin/updateUserSubscriptionStatus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: "test-user-vip",
        secret: "testsecret123",
        status: "pro_1d"
      })
    });
    const data1 = await res1.json();
    if (!data1.success) {
      throw new Error(`Failed to update status: ${data1.error}`);
    }
    console.log("  ✅ API returned success.");

    // Verify database updates
    const backendData = JSON.parse(fs.readFileSync(mockBackendDbPath, 'utf8'));
    const profileVip = backendData.users["test-user-vip"].profile;
    
    console.log("  Verifying profile properties for VIP -> pro_1d:");
    console.log(`    activePlan: ${profileVip.activePlan} (expected: pro_1d)`);
    console.log(`    previousActivePlan: ${profileVip.previousActivePlan} (expected: vip)`);
    console.log(`    pro1dUsed: ${profileVip.pro1dUsed} (expected: true)`);
    
    if (profileVip.activePlan !== "pro_1d") {
      throw new Error("activePlan was not updated to pro_1d");
    }
    if (profileVip.previousActivePlan !== "vip") {
      throw new Error("previousActivePlan was not set to vip");
    }
    if (profileVip.pro1dUsed !== true) {
      throw new Error("pro1dUsed was not set to true");
    }
    console.log("  ✅ VIP -> pro_1d assertions passed.");

    // 2. Upgrade Free DJ to pro_1d
    console.log("\n2. Upgrading Free user to pro_1d...");
    const res2 = await fetch("http://localhost:4004/api/admin/updateUserSubscriptionStatus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: "test-user-free",
        secret: "testsecret123",
        status: "pro_1d"
      })
    });
    const data2 = await res2.json();
    if (!data2.success) {
      throw new Error(`Failed to update status: ${data2.error}`);
    }
    console.log("  ✅ API returned success.");

    const backendData2 = JSON.parse(fs.readFileSync(mockBackendDbPath, 'utf8'));
    const profileFree = backendData2.users["test-user-free"].profile;
    
    console.log("  Verifying profile properties for Free -> pro_1d:");
    console.log(`    activePlan: ${profileFree.activePlan} (expected: pro_1d)`);
    console.log(`    previousActivePlan: ${profileFree.previousActivePlan} (expected: free)`);
    console.log(`    pro1dUsed: ${profileFree.pro1dUsed} (expected: true)`);
    
    if (profileFree.activePlan !== "pro_1d") {
      throw new Error("activePlan was not updated to pro_1d");
    }
    if (profileFree.previousActivePlan !== "free") {
      throw new Error("previousActivePlan was not set to free");
    }
    if (profileFree.pro1dUsed !== true) {
      throw new Error("pro1dUsed was not set to true");
    }
    console.log("  ✅ Free -> pro_1d assertions passed.");

    console.log("\n🎉 ALL PRO 1 DAY LIFECYCLE TESTS PASSED SUCCESSFULLY!");
    cleanupAndExit(0);
  } catch (err) {
    console.error("❌ TEST FAILED:", err.message);
    cleanupAndExit(1);
  }
});

function cleanupAndExit(code) {
  server.close(() => {
    try {
      if (fs.existsSync(mockBackendDbPath)) fs.unlinkSync(mockBackendDbPath);
      if (fs.existsSync(mockFirestorePath)) fs.unlinkSync(mockFirestorePath);
    } catch (e) {}
    process.exit(code);
  });
}
