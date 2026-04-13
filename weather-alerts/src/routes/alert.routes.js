// Alert routes - trigger condition checks and view alerts
const express = require("express");
const router = express.Router();
const alertService = require("../services/alert.service");

// POST /api/alerts/check/:plantId
// Runs the full condition check for a plant and sends alerts if needed
router.post("/check/:plantId", async (req, res) => {
  try {
    const plantId = parseInt(req.params.plantId);
    const alerts = await alertService.checkAndAlert(plantId);
    res.json({ success: true, alertsGenerated: alerts.length, alerts });
  } catch (err) {
    console.error("Alert check error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/alerts/user/:userId
// Returns all alerts for a specific user
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const alerts = await alertService.getAlertsForUser(userId);
    res.json({ success: true, data: alerts });
  } catch (err) {
    console.error("Get alerts error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});
// POST /api/alerts/report — manually trigger daily report (for testing)
router.post("/report", async (req, res) => {
  try {
    const { sendDailyReports } = require("../services/report.service");
    await sendDailyReports();
    res.json({ success: true, message: "Daily reports sent!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
module.exports = router;