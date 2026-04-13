// Plant condition rules engine
// Takes plant thresholds, sensor readings, and weather — returns a list of issues

const MOISTURE_TOLERANCE = 15;
const LIGHT_TOLERANCE = 500;
const TEMP_TOLERANCE = 5;

const RISKY_FORECASTS = ["Rain", "Drizzle", "Thunderstorm", "Snow", "Extreme"];
const HOT_WEATHER_THRESHOLD = 35;
const COLD_WEATHER_THRESHOLD = 5;

function checkPlantConditions(plant, sensorData, weather) {
  const issues = [];

  // --- Soil Moisture Check ---
  const moistureDiff = sensorData.soilMoisture - plant.optimalMoisture;
  if (moistureDiff < -MOISTURE_TOLERANCE) {
    issues.push({
      alertType: "moisture",
      message: `⚠️ "${plant.plantName}" has low soil moisture (${sensorData.soilMoisture}%). Consider watering soon.`,
    });
  } else if (moistureDiff > MOISTURE_TOLERANCE) {
    issues.push({
      alertType: "moisture",
      message: `⚠️ "${plant.plantName}" soil is too wet (${sensorData.soilMoisture}%). Check drainage.`,
    });
  }

  // --- Light Intensity Check ---
  const lightDiff = sensorData.lightIntensity - plant.optimalLight;
  if (lightDiff < -LIGHT_TOLERANCE) {
    issues.push({
      alertType: "light",
      message: `⚠️ "${plant.plantName}" is not getting enough light (${sensorData.lightIntensity} lux). Move to a brighter spot.`,
    });
  }

  // --- Temperature Check ---
  const tempDiff = sensorData.temperature - plant.optimalTemperature;
  if (Math.abs(tempDiff) > TEMP_TOLERANCE) {
    const direction = tempDiff > 0 ? "too warm" : "too cold";
    issues.push({
      alertType: "temperature",
      message: `⚠️ "${plant.plantName}" environment is ${direction} (${sensorData.temperature}°C). Optimal is ${plant.optimalTemperature}°C.`,
    });
  }

  // --- Weather-Aware Checks ---
  if (weather) {
    if (RISKY_FORECASTS.includes(weather.forecast)) {
      issues.push({
        alertType: "weather",
        message: `🌧️ "${plant.plantName}" may be affected by upcoming ${weather.forecast}. Consider moving it indoors.`,
      });
    }

    if (weather.temperature > HOT_WEATHER_THRESHOLD) {
      issues.push({
        alertType: "weather",
        message: `🌡️ Outside temperature is very high (${weather.temperature}°C). Protect "${plant.plantName}" from heat stress.`,
      });
    }

    if (weather.temperature < COLD_WEATHER_THRESHOLD) {
      issues.push({
        alertType: "weather",
        message: `❄️ Outside temperature is very low (${weather.temperature}°C). Bring "${plant.plantName}" inside if it's outdoors.`,
      });
    }
  }

  return issues;
}

module.exports = { checkPlantConditions };