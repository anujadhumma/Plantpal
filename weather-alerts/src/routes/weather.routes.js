// Weather routes - fetch weather for a plant's location and store it
const express = require("express");
const router = express.Router();
const weatherService = require("../services/weather.service");

// GET /api/weather/:plantId
// Fetches current weather for the plant's location and saves it to the DB
router.get("/:plantId", async (req, res) => {
  try {
    const plantId = parseInt(req.params.plantId);
    const weather = await weatherService.fetchAndStoreWeather(plantId);
    res.json({ success: true, data: weather });
  } catch (err) {
    console.error("Weather fetch error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/weather/:plantId/latest
// Returns the most recently stored weather entry for this plant's location
router.get("/:plantId/latest", async (req, res) => {
  try {
    const plantId = parseInt(req.params.plantId);
    const weather = await weatherService.getLatestWeather(plantId);
    res.json({ success: true, data: weather });
  } catch (err) {
    console.error("Latest weather error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;