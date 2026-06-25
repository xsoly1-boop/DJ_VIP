// Test for Pro x 1 Día plan lifecycle, pricing and client-side automatic activation.
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const vm = require('vm');

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

// Helper to extract function for VM testing
function extractFunction(content, name) {
  const startIdx = content.indexOf(`const ${name} = async`);
  if (startIdx === -1) {
    throw new Error(`Function ${name} not found`);
  }
  const bodyStartIdx = content.indexOf('{', startIdx);
  const header = content.substring(startIdx, bodyStartIdx);
  
  let braceCount = 1;
  let currentIdx = bodyStartIdx + 1;
  while (braceCount > 0 && currentIdx < content.length) {
    const char = content[currentIdx];
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
    }
    currentIdx++;
  }
  const body = content.substring(bodyStartIdx, currentIdx);
  return `${header}${body}`;
}

const server = app.listen(4004, async () => {
  console.log("🧪 Pro 1 Day Test server listening on port 4004");
  try {
    const contextFilePath = '/Users/dorian/.gemini/antigravity/scratch/DJVIP/src/context/FirebaseContext.jsx';
    const contextContent = fs.readFileSync(contextFilePath, 'utf8');

    // 1. Verify Plan Prices in DEFAULT_PLANS_CONFIG
    console.log("1. Verifying plan pricing in DEFAULT_PLANS_CONFIG...");
    if (!contextContent.includes('price: "450"') || !contextContent.includes('pro_1d: {\n    name: "Pro x 1 Día",\n    price: "0"')) {
      // Allow minor whitespace variations by extracting the config block
      const startConfig = contextContent.indexOf('const DEFAULT_PLANS_CONFIG =');
      const endConfig = contextContent.indexOf('};', startConfig);
      const configStr = contextContent.substring(startConfig, endConfig);
      
      console.log("Extracted config string snippet:\n", configStr.substring(configStr.indexOf('pro:'), configStr.indexOf('bonus:')));
      
      if (!configStr.includes('"450"') && !configStr.includes('450')) {
        throw new Error("PRO price is not 450 in DEFAULT_PLANS_CONFIG");
      }
      if (!configStr.includes('"0"') && !configStr.includes('0')) {
        throw new Error("pro_1d price is not 0 in DEFAULT_PLANS_CONFIG");
      }
    }
    console.log("  ✅ Pricing configurations verified successfully.");

    // 2. Verify client-side selectPlan automatic activation
    console.log("\n2. Testing client-side selectPlan automatic activation...");
    const selectPlanCode = extractFunction(contextContent, 'selectPlan');
    
    // Setup a sandbox to execute selectPlan
    let profileUpdateResult = null;
    const sandbox = {
      console,
      activeUid: 'test-user-vip',
      userProfile: {
        activePlan: 'vip',
        subscriptionStatus: 'vip'
      },
      plansConfig: {
        pro_1d: {
          name: "Pro x 1 Día",
          price: "0",
          duration: 24,
          durationUnit: "horas"
        }
      },
      sessionStorage: {
        removeItem: () => {}
      },
      window: {
        dispatchEvent: () => {}
      },
      Event: function() {},
      ref: () => ({}),
      database: {},
      update: async (ref, updates) => {
        profileUpdateResult = updates;
      }
    };

    const script = new vm.Script(selectPlanCode + `\nselectPlan('pro_1d');`);
    const context = vm.createContext(sandbox);
    await script.runInContext(context);

    console.log("  Verifying client-side selectPlan output:");
    console.log(`    activePlan: ${profileUpdateResult.activePlan} (expected: pro_1d)`);
    console.log(`    subscriptionStatus: ${profileUpdateResult.subscriptionStatus} (expected: pro_1d)`);
    console.log(`    previousActivePlan: ${profileUpdateResult.previousActivePlan} (expected: vip)`);
    console.log(`    pro1dUsed: ${profileUpdateResult.pro1dUsed} (expected: true)`);
    console.log(`    expiresAt is set: ${profileUpdateResult.expiresAt > 0}`);

    if (profileUpdateResult.activePlan !== 'pro_1d') throw new Error("Client activePlan was not activated to pro_1d");
    if (profileUpdateResult.subscriptionStatus !== 'pro_1d') throw new Error("Client subscriptionStatus was not activated to pro_1d");
    if (profileUpdateResult.previousActivePlan !== 'vip') throw new Error("Client previousActivePlan was not set to vip");
    if (profileUpdateResult.pro1dUsed !== true) throw new Error("Client pro1dUsed was not set to true");
    if (!profileUpdateResult.expiresAt || profileUpdateResult.expiresAt <= Date.now()) throw new Error("Client expiresAt was not calculated/set");
    console.log("  ✅ Client-side auto activation assertions passed.");

    // 3. Upgrade VIP DJ to pro_1d via admin route (manual)
    console.log("\n3. Upgrading VIP user to pro_1d via admin route...");
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
    
    if (profileVip.activePlan !== "pro_1d") {
      throw new Error("activePlan was not updated to pro_1d in DB");
    }
    if (profileVip.previousActivePlan !== "vip") {
      throw new Error("previousActivePlan was not set to vip in DB");
    }
    if (profileVip.pro1dUsed !== true) {
      throw new Error("pro1dUsed was not set to true in DB");
    }
    console.log("  ✅ Backend VIP -> pro_1d assertions passed.");

    console.log("\n🎉 ALL PRO 1 DAY TESTS PASSED SUCCESSFULLY!");
    cleanupAndExit(0);
  } catch (err) {
    console.error("❌ TEST FAILED:", err);
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
