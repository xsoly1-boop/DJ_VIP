// server.cjs – minimal Express API for subscription management (CommonJS)
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const paymentService = require('./paymentService.cjs');
const adminRoutes = require('./adminRoutes.cjs'); // New admin routes

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Root path status message
app.get('/', (req, res) => {
  res.send('🚀 DJVIP Subscription Backend API is running.');
});

// Admin routes (delete user, etc.)
app.use('/api/admin', adminRoutes);

// Create a new subscription
app.post('/api/subscription/create', async (req, res) => {
  try {
    const { userId, planId, paymentMethod } = req.body;
    const result = await paymentService.createSubscription({ userId, planId, paymentMethod });
    res.json({ success: true, data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Update an existing subscription
app.post('/api/subscription/update', async (req, res) => {
  try {
    const { subscriptionId, newPlanId } = req.body;
    const result = await paymentService.updateSubscription({ subscriptionId, newPlanId });
    res.json({ success: true, data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Cancel a subscription
app.post('/api/subscription/cancel', async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    const result = await paymentService.cancelSubscription({ subscriptionId });
    res.json({ success: true, data: result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
});

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`🚀 Subscription API listening on port ${PORT}`));
}
module.exports = app;
