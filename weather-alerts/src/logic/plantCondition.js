const DEFAULTS = {
  optimalMoisture:    30,    // midpoint of 20–40%
  optimalLight:       12500, // midpoint of 5,000–20,000 lux
  optimalTemperature: 21,    // midpoint of 18–24°C
  optimalHumidity:    50,    // midpoint of 40–60%
  optimalPressure:    1000,  // midpoint of 950–1,050 hPa
};

const TOLERANCE = {
  moisture:    10,   // ±10 → 20–40% range
  light:       7500, // ±7500 → 5,000–20,000 lux range
  temperature: 3,    // ±3 → 18–24°C range
  humidity:    10,   // ±10 → 40–60% range
  pressure:    50,   // ±50 → 950–1,050 hPa range
};

// Weather alert config

const RISKY_FORECASTS        = ["Rain", "Drizzle", "Thunderstorm", "Snow", "Extreme"];
const HOT_WEATHER_THRESHOLD = 35;
const COLD_WEATHER_THRESHOLD = 5;

function resolve(plantValue, defaultValue) {
  return (plantValue != null && !isNaN(plantValue)) ? plantValue : defaultValue;
}

function format(value, decimals = 2) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(decimals) : value;
}

function checkPlantConditions(plant, sensorData, weather) {
  const issues = [];

  const optMoisture    = resolve(plant.optimalMoisture,    DEFAULTS.optimalMoisture);
  const optLight       = resolve(plant.optimalLight,       DEFAULTS.optimalLight);
  const optTemperature = resolve(plant.optimalTemperature, DEFAULTS.optimalTemperature);
  const optHumidity    = resolve(plant.optimalHumidity,    DEFAULTS.optimalHumidity);
  const optPressure    = resolve(plant.optimalPressure,    DEFAULTS.optimalPressure);

  if (sensorData.soilMoisture != null) {
    const diff = sensorData.soilMoisture - optMoisture;
    const moisture = format(sensorData.soilMoisture);

    if (diff < -TOLERANCE.moisture) {
      issues.push({
        alertType: "moisture",
        message: `⚠️ "${plant.plantName}" has low soil moisture (${moisture}%). Time to water your plant.`,
      });
    } else if (diff > TOLERANCE.moisture) {
      issues.push({
        alertType: "moisture",
        message: `⚠️ "${plant.plantName}" soil is too wet (${moisture}%). Do not water your plant yet, check drainage.`,
      });
    }
  }

  if (sensorData.lightIntensity != null) {
    const diff = sensorData.lightIntensity - optLight;
    const light = format(sensorData.lightIntensity);

    if (diff < -TOLERANCE.light) {
      issues.push({
        alertType: "light",
        message: `⚠️ "${plant.plantName}" is not getting enough light (${light} lux). Move to a brighter spot.`,
      });
    } else if (diff > TOLERANCE.light) {
      issues.push({
        alertType: "light",
        message: `⚠️ "${plant.plantName}" is getting too much direct light (${light} lux). Consider moving to indirect light.`,
      });
    }
  }

  if (sensorData.temperature != null) {
    const diff = sensorData.temperature - optTemperature;
    const temperature = format(sensorData.temperature);
    const optimalTemp = format(optTemperature);

    if (Math.abs(diff) > TOLERANCE.temperature) {
      const direction = diff > 0 ? "too warm" : "too cold";
      issues.push({
        alertType: "temperature",
        message: `⚠️ "${plant.plantName}" environment is ${direction} (${temperature}°C). Optimal is around ${optimalTemp}°C.`,
      });
    }
  }

  if (sensorData.humidity != null) {
    const diff = sensorData.humidity - optHumidity;
    const humidity = format(sensorData.humidity);

    if (diff < -TOLERANCE.humidity) {
      issues.push({
        alertType: "humidity",
        message: `💨 "${plant.plantName}" air is too dry (${humidity}% humidity). Consider misting or using a humidifier.`,
      });
    } else if (diff > TOLERANCE.humidity) {
      issues.push({
        alertType: "humidity",
        message: `💧 "${plant.plantName}" air is too humid (${humidity}%). Improve air circulation to prevent mould.`,
      });
    }
  }

  if (sensorData.pressure != null) {
    const diff = sensorData.pressure - optPressure;
    const pressure = format(sensorData.pressure);

    if (Math.abs(diff) > TOLERANCE.pressure) {
      const direction = diff > 0 ? "unusually high" : "unusually low";
      issues.push({
        alertType: "pressure",
        message: `🌬️ "${plant.plantName}" is experiencing ${direction} air pressure (${pressure} hPa). Monitor for stress signs.`,
      });
    }
  }

  if (weather) {
    if (RISKY_FORECASTS.includes(weather.forecast)) {
      issues.push({
        alertType: "weather",
        message: `🌧️ "${plant.plantName}" may be affected by upcoming ${weather.forecast}. Consider moving it indoors.`,
      });
    }

    if (weather.temperature > HOT_WEATHER_THRESHOLD) {
      const outsideTemp = format(weather.temperature);
      issues.push({
        alertType: "weather",
        message: `🌡️ Outside temperature is very high (${outsideTemp}°C). Protect "${plant.plantName}" from heat stress.`,
      });
    }

    if (weather.temperature < COLD_WEATHER_THRESHOLD) {
      const outsideTemp = format(weather.temperature);
      issues.push({
        alertType: "weather",
        message: `❄️ Outside temperature is very low (${outsideTemp}°C). Bring "${plant.plantName}" inside if it's outdoors.`,
      });
    }
  }

  return issues;
}

module.exports = { checkPlantConditions, DEFAULTS, TOLERANCE };