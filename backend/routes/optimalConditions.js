const express    = require("express");
const router     = express.Router();
const { createClient } = require("@supabase/supabase-js");
const { getOptimalConditions } = require("../lib/getOptimalConditions");

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  
);

/**
 * POST /api/optimal-conditions
 * Body: { plantId: number, plantType: string }
 *
 * 1. Calls OpenRouter (or returns hardcoded defaults for General/Other)
 * 2. Updates the Plant row in Supabase with the optimal values
 * 3. Returns the optimal values to the frontend
 */
router.post("/optimal-conditions", async (req, res) => {
  const { plantId, plantType } = req.body;

  if (!plantId || !plantType) {
    return res.status(400).json({ error: "plantId and plantType are required" });
  }

  try {
    const optimal = await getOptimalConditions(plantType);

    const { error: updateError } = await supabase
      .from("Plant")
      .update({
        optimalTemperature: optimal.optimalTemperature,
        optimalLight:       optimal.optimalLight,
        optimalMoisture:    optimal.optimalMoisture,
        optimalHumidity:    optimal.optimalHumidity,
        optimalPressure:    optimal.optimalPressure,
      })
      .eq("id", plantId);

    if (updateError) throw updateError;

    return res.json({ success: true, optimal });

  } catch (err) {
    console.error("[optimal-conditions] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;