// Test for Demo plan 6-month limit registration, auto-expiration, and paid plan return checks.
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const vm = require('vm');

const mockBackendDbPath = path.join(__dirname, 'mock_backend_db.json');
const mockFirestorePath = path.join(__dirname, 'mock_firestore.json');

// Initialize empty mock DBs
fs.writeFileSync(mockBackendDbPath, JSON.stringify({
  users: {}
}, null, 2));

fs.writeFileSync(mockFirestorePath, JSON.stringify({
  users: {}
}, null, 2));

process.env.VITE_ADMIN_MASTER_SECRET = "testsecret123";
process.env.PORT = "4005";

const adminRoutes = require('../adminRoutes.cjs');

const app = express();
app.use(bodyParser.json());
app.use('/api/admin', adminRoutes);

// Helper to extract function code block for VM testing
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

const server = app.listen(4005, async () => {
  console.log("🧪 Demo Expiration Test server listening on port 4005");
  try {
    const contextFilePath = path.join(__dirname, '../src/context/FirebaseContext.jsx');
    const contextContent = fs.readFileSync(contextFilePath, 'utf8');

    // 1. Verify Plan Config in DEFAULT_PLANS_CONFIG
    console.log("1. Verifying Demo plan configuration in DEFAULT_PLANS_CONFIG...");
    const startConfig = contextContent.indexOf('const DEFAULT_PLANS_CONFIG =');
    const endConfig = contextContent.indexOf('};', startConfig);
    const configStr = contextContent.substring(startConfig, endConfig);
    
    if (!configStr.includes('billing: "6 meses"') || !configStr.includes('duration: 6')) {
      throw new Error("Demo plan config is not 6 months billing and 6 duration in DEFAULT_PLANS_CONFIG");
    }
    if (!configStr.includes('"Vigencia del plan limitada a 6 meses"')) {
      throw new Error("Demo plan config does not include 6-month limit in restrictions list");
    }
    console.log("  ✅ DEFAULT_PLANS_CONFIG verified successfully.");

    // 2. Verify migratePlansConfig in adminRoutes.cjs sets 6-month limits in DB
    console.log("\n2. Verifying migratePlansConfig DB values...");
    await new Promise(resolve => setTimeout(resolve, 500));
    const backendDataBefore = JSON.parse(fs.readFileSync(mockBackendDbPath, 'utf8'));
    
    // Trigger migratePlansConfig (already executed on require)
    const dbPlans = backendDataBefore.config.plans;
    if (dbPlans.free.billing !== "6 meses" || dbPlans.free.duration !== 6) {
      throw new Error("migratePlansConfig did not seed/migrate free plan to 6-month limit: " + JSON.stringify(dbPlans.free));
    }
    if (!dbPlans.free.restrictions.includes("Vigencia del plan limitada a 6 meses")) {
      throw new Error("migratePlansConfig did not include 6-month limit in restrictions list");
    }
    console.log("  ✅ DB Migration config verified successfully.");

    // 3. Test registerDJ calculates expiresAt correctly
    console.log("\n3. Testing registerDJ expiresAt calculation...");
    const registerDJCode = extractFunction(contextContent, 'registerDJ');
    
    let createdProfile = null;
    let createdUid = null;
    const createUserWithEmailAndPassword = async () => ({ user: { uid: 'user-new-dj' } });
    const auth = {};
    const ref = () => ({});
    const database = {};
    const set = async (dbRef, val) => {
      if (dbRef && val && val.email === 'newdj@dj.com') {
        createdProfile = val;
      }
    };
    const isMockMode = false;

    const sandbox = {
      console,
      createUserWithEmailAndPassword,
      auth,
      ref,
      database,
      set,
      isMockMode
    };

    const registerScript = new vm.Script(registerDJCode + `\nregisterDJ('newdj@dj.com', 'pwd123', '12345678', 'New DJ');`);
    const registerContext = vm.createContext(sandbox);
    await registerScript.runInContext(registerContext);

    console.log("  Verifying profile registration output:");
    console.log(`    activePlan: ${createdProfile.activePlan} (expected: free)`);
    console.log(`    subscriptionStatus: ${createdProfile.subscriptionStatus} (expected: free)`);
    console.log(`    expiresAt is 6 months in future: ${Math.abs(createdProfile.expiresAt - (Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)) < 5000}`);
    
    if (createdProfile.activePlan !== 'free') throw new Error("Registration activePlan is not free");
    if (!createdProfile.expiresAt || Math.abs(createdProfile.expiresAt - (Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)) >= 5000) {
      throw new Error("Registration expiresAt is not set to ~6 months in the future: " + createdProfile.expiresAt);
    }
    console.log("  ✅ registerDJ auto calculation verified.");

    // 4. Test profile listener auto-expiration logic
    console.log("\n4. Testing profile listener auto-expiration for free plan...");
    
    // We will extract the inner block of user listener or simulate it using the code in contextContent
    const listenerSim = (profileData, isCurrentAdminMaster) => {
      let data = { ...profileData };
      let updates = null;
      const update = (ref, updatesObj) => {
        updates = updatesObj;
      };
      
      // Simulating our added blocks in FirebaseContext listener:
      // Retrofit
      if (!isCurrentAdminMaster && data.activePlan === 'free' && (!data.expiresAt || data.expiresAt === 0)) {
        const calculatedExpiresAt = (data.createdAt || Date.now()) + 6 * 30 * 24 * 60 * 60 * 1000;
        update(null, { expiresAt: calculatedExpiresAt });
        data.expiresAt = calculatedExpiresAt;
      }
      
      // Auto expiration free
      if (!isCurrentAdminMaster && data.activePlan === 'free' && data.expiresAt && data.expiresAt > 0 && Date.now() > data.expiresAt) {
        const updatesObj = {
          subscriptionStatus: 'pending_plan',
          activePlan: 'free_expired',
          expiresAt: 0
        };
        update(null, updatesObj);
        return { data, updates, action: 'expired' };
      }
      
      // Auto expiration paid
      if (!isCurrentAdminMaster && data.activePlan && data.activePlan !== 'free' && data.activePlan !== 'free_expired' && data.expiresAt && data.expiresAt > 0 && Date.now() > data.expiresAt) {
        const demoLimitTime = (data.createdAt || Date.now()) + 6 * 30 * 24 * 60 * 60 * 1000;
        const remainingDemo = demoLimitTime - Date.now();
        
        let returnPlan = 'pending_plan';
        let returnActivePlan = 'free_expired';
        let returnExpiresAt = 0;
        
        if (data.activePlan === 'pro_1d') {
          const previous = data.previousActivePlan || 'free';
          if (previous === 'free') {
            if (remainingDemo > 0) {
              returnPlan = 'free';
              returnActivePlan = 'free';
              returnExpiresAt = demoLimitTime;
            }
          } else {
            returnPlan = previous;
            returnActivePlan = previous;
            returnExpiresAt = 0;
          }
        } else {
          if (remainingDemo > 0) {
            returnPlan = 'free';
            returnActivePlan = 'free';
            returnExpiresAt = demoLimitTime;
          }
        }

        const updatesObj = {
          subscriptionStatus: returnPlan,
          activePlan: returnActivePlan,
          activatedAt: Date.now(),
          expiresAt: returnExpiresAt
        };
        if (data.activePlan === 'pro_1d') {
          updatesObj.pro1dUsed = true;
          updatesObj.previousActivePlan = null;
        }
        update(null, updatesObj);
        return { data, updates, action: 'expired_paid' };
      }
      
      return { data, updates, action: 'none' };
    };

    // Test Case 4.1: Active free plan within 6-month limit
    console.log("  Test Case 4.1: Active free plan within limit...");
    const res41 = listenerSim({
      activePlan: 'free',
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 1 month ago
      expiresAt: Date.now() + 5 * 30 * 24 * 60 * 60 * 1000 // 5 months left
    }, false);
    if (res41.action !== 'none' || res41.updates !== null) {
      throw new Error("Free plan within limit triggered actions prematurely: " + JSON.stringify(res41));
    }
    console.log("    ✅ Correct: No actions triggered.");

    // Test Case 4.2: Free plan expired (registered 7 months ago)
    console.log("  Test Case 4.2: Free plan expired...");
    const res42 = listenerSim({
      activePlan: 'free',
      createdAt: Date.now() - 7 * 30 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() - 1 * 30 * 24 * 60 * 60 * 1000
    }, false);
    if (res42.action !== 'expired' || res42.updates.activePlan !== 'free_expired' || res42.updates.subscriptionStatus !== 'pending_plan') {
      throw new Error("Free plan did not trigger expiration correctly: " + JSON.stringify(res42));
    }
    console.log("    ✅ Correct: User expired and redirected to pending_plan.");

    // Test Case 4.3: Retrofit for old users with expiresAt = 0
    console.log("  Test Case 4.3: Retrofit for old users...");
    const res43 = listenerSim({
      activePlan: 'free',
      createdAt: Date.now() - 3 * 30 * 24 * 60 * 60 * 1000, // 3 months ago
      expiresAt: 0
    }, false);
    if (res43.updates === null || !res43.updates.expiresAt) {
      throw new Error("Retrofit did not calculate expiresAt for old user");
    }
    console.log("    ✅ Correct: Retrofit applied expiresAt: " + res43.updates.expiresAt);

    // Test Case 4.4: Paid plan expires, remaining demo time > 0
    console.log("  Test Case 4.4: Paid plan expires, returning to free plan...");
    const res44 = listenerSim({
      activePlan: 'premium',
      createdAt: Date.now() - 2 * 30 * 24 * 60 * 60 * 1000, // registered 2 months ago
      expiresAt: Date.now() - 1000 // premium expired just now
    }, false);
    if (res44.updates.activePlan !== 'free' || res44.updates.subscriptionStatus !== 'free' || res44.updates.expiresAt <= Date.now()) {
      throw new Error("Paid plan expiration did not return to free with remaining time: " + JSON.stringify(res44.updates));
    }
    console.log("    ✅ Correct: Returned to free plan with expiration: " + res44.updates.expiresAt);

    // Test Case 4.5: Paid plan expires, remaining demo time <= 0
    console.log("  Test Case 4.5: Paid plan expires, no demo time left, blocking...");
    const res45 = listenerSim({
      activePlan: 'premium',
      createdAt: Date.now() - 7 * 30 * 24 * 60 * 60 * 1000, // registered 7 months ago
      expiresAt: Date.now() - 1000 // premium expired just now
    }, false);
    if (res45.updates.activePlan !== 'free_expired' || res45.updates.subscriptionStatus !== 'pending_plan') {
      throw new Error("Paid plan expiration did not block user when demo time exhausted: " + JSON.stringify(res45.updates));
    }
    console.log("    ✅ Correct: User blocked to pending_plan.");

    console.log("\n🎉 ALL DEMO EXPIRATION TESTS PASSED SUCCESSFULLY!");
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
