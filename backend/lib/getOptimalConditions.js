const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-4o-mini"; 

const GENERAL_DEFAULTS = {
  optimalTemperature: 21,   // midpoint of 18–24°C
  optimalLight:       12500, // midpoint of 5,000–20,000 lux
  optimalMoisture:    30,   // midpoint of 20–40%
  optimalHumidity:    50,   // midpoint of 40–60%
  optimalPressure:    1000, // midpoint of 950–1,050 hPa
};

const GENERAL_TYPES = ["general", "other"];

/**
 * Returns optimal sensor midpoints for a given plant type.
 * For General / Other → returns hardcoded defaults immediately.
 * For everything else → calls OpenRouter and parses the JSON response.
 *
 * @param {string} plantType  e.g. "Rose", "Orchid", "Succulent"
 * @returns {Promise<{ optimalTemperature, optimalLight, optimalMoisture, optimalHumidity, optimalPressure }>}
 */
async function getOptimalConditions(plantType) {
  // Skip API call for generic types
  if (!plantType || GENERAL_TYPES.includes(plantType.toLowerCase())) {
    return GENERAL_DEFAULTS;
  }

  const prompt = `
You are a plant care expert. Given the plant type "${plantType}", return the single optimal midpoint value for each of these environmental conditions. These will be used as thresholds in a plant monitoring system.

Return ONLY a valid JSON object with exactly these keys and numeric values. No explanation, no markdown, no extra text:

{
  "optimalTemperature": <number in °C>,
  "optimalLight": <number in lux>,
  "optimalMoisture": <number as % between 0-100>,
  "optimalHumidity": <number as % between 0-100>,
  "optimalPressure": <number in hPa>
}

If the plant type is unrecognized or very general, use these safe fallback values:
optimalTemperature: 21, optimalLight: 12500, optimalMoisture: 30, optimalHumidity: 50, optimalPressure: 1000
`.trim();

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer":  "https://plantpal.app", 
      "X-Title":       "PlantPal",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 200,
      temperature: 0.2, 
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const raw  = data?.choices?.[0]?.message?.content?.trim();

  if (!raw) throw new Error("Empty response from OpenRouter");

  const cleaned = raw.replace(/```json|```/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("OpenRouter returned non-JSON:", raw);
  
    return GENERAL_DEFAULTS;
  }

  return {
    optimalTemperature: typeof parsed.optimalTemperature === "number" ? parsed.optimalTemperature : GENERAL_DEFAULTS.optimalTemperature,
    optimalLight:       typeof parsed.optimalLight       === "number" ? parsed.optimalLight       : GENERAL_DEFAULTS.optimalLight,
    optimalMoisture:    typeof parsed.optimalMoisture    === "number" ? parsed.optimalMoisture    : GENERAL_DEFAULTS.optimalMoisture,
    optimalHumidity:    typeof parsed.optimalHumidity    === "number" ? parsed.optimalHumidity    : GENERAL_DEFAULTS.optimalHumidity,
    optimalPressure:    typeof parsed.optimalPressure    === "number" ? parsed.optimalPressure    : GENERAL_DEFAULTS.optimalPressure,
  };
}

module.exports = { getOptimalConditions, GENERAL_DEFAULTS };