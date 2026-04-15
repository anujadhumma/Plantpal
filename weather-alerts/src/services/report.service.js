// Report service - sends recurring plant status emails to users with plants
const { Pool } = require("pg");
const emailService = require("./email.service");
const axios = require("axios");
const { checkPlantConditions } = require("../logic/plantCondition");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const DEFAULTS = {
  optimalMoisture:    30,
  optimalLight:       12500,
  optimalTemperature: 21,
  optimalHumidity:    50,
  optimalPressure:    1000,
};

async function sendDailyReports() {
  try {
    const { rows: users } = await pool.query(
      `SELECT DISTINCT p.id, p.name, p.email, p.location
       FROM profiles p
       INNER JOIN "Plant" pl ON pl."userId" = p.id
       WHERE p.email IS NOT NULL`
    );
    console.log(`Sending reports to ${users.length} users...`);
    for (const user of users) await sendReportToUser(user);
  } catch (err) {
    console.error("Error sending scheduled reports:", err.message);
  }
}

async function sendReportToUser(user) {
  try {
    const { rows: plants } = await pool.query(
      'SELECT * FROM "Plant" WHERE "userId" = $1',
      [user.id]
    );

    const plantReports = [];
    for (const plant of plants) {
      const report = await checkPlantStatus(plant);
      plantReports.push(report);
    }

    const weatherInfo = await getWeatherInfo(plants[0], user.location);
    const emailBody   = buildEmailBody(user.name || "Plant Parent", plantReports, weatherInfo);

    await emailService.sendEmail({
      to:      user.email,
      subject: `🌿 PlantPal Daily Update — ${new Date().toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}`,
      body:    emailBody,
    });

    console.log(`Report sent to ${user.email}`);
  } catch (err) {
    console.error(`Error sending report to ${user.email}:`, err.message);
  }
}

async function checkPlantStatus(plant) {
  try {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const { rows } = await pool.query(
      `SELECT
        AVG(temperature_c)         AS avg_temp,
        AVG(humidity_percent)      AS avg_humidity,
        AVG(soil_moisture_percent) AS avg_moisture,
        AVG(light_lux)             AS avg_light,
        COUNT(*)                   AS reading_count
       FROM esp32_readings
       WHERE device_id = $1 AND created_at >= $2`,
      [plant.device_id, twelveHoursAgo]
    );

    const data = rows[0];
    if (!data || Number(data.reading_count) === 0) {
      return { plantName: plant.plantName, status: "warning", issues: [], sensorData: null };
    }

    const sensorData = {
      temperature:    Number(data.avg_temp),
      humidity:       Number(data.avg_humidity),
      soilMoisture:   Number(data.avg_moisture),
      lightIntensity: Number(data.avg_light),
    };

    const plantWithDefaults = {
      ...plant,
      optimalMoisture:    plant.optimalMoisture    ?? DEFAULTS.optimalMoisture,
      optimalLight:       plant.optimalLight        ?? DEFAULTS.optimalLight,
      optimalTemperature: plant.optimalTemperature  ?? DEFAULTS.optimalTemperature,
      optimalHumidity:    plant.optimalHumidity     ?? DEFAULTS.optimalHumidity,
      optimalPressure:    plant.optimalPressure     ?? DEFAULTS.optimalPressure,
    };

    const issues = checkPlantConditions(plantWithDefaults, sensorData, null);
    return {
      plantName:  plant.plantName,
      status:     issues.length === 0 ? "ok" : "warning",
      issues,
      sensorData,
    };
  } catch (err) {
    return { plantName: plant.plantName, status: "error", issues: [], sensorData: null };
  }
}

async function getWeatherInfo(plant, userLocation) {
  try {
    const location = plant?.location || userLocation || "Toledo, US";
    const response = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
      params: { q: location, appid: process.env.OPENWEATHER_API_KEY, units: "metric" },
    });
    return {
      location,
      forecast:    response.data.weather[0]?.main,
      description: response.data.weather[0]?.description,
      temp:        response.data.main.temp,
      humidity:    response.data.main.humidity,
      severe:      ["Rain","Drizzle","Thunderstorm","Snow","Hurricane","Tornado","Extreme"]
                     .includes(response.data.weather[0]?.main),
    };
  } catch { return null; }
}

// Plain text email - nicely formatted with emojis and clear sections
function buildEmailBody(userName, plantReports, weather) {
  const greeting = userName?.trim() || "Plant Parent";
  const date     = new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" });
  const divider  = "─────────────────────────────";

  let body = "";
  body += `🌿 PlantPal Daily Update\n`;
  body += `${date}\n\n`;
  body += `Hi ${greeting}! 👋\n`;
  body += `Here's how your plants are doing today.\n\n`;
  body += `${divider}\n\n`;

  for (const report of plantReports) {
    const statusIcon = report.status === "ok" ? "✅" : report.status === "warning" ? "⚠️" : "❌";
    body += `🌿 ${report.plantName}  ${statusIcon}\n\n`;

    if (report.sensorData) {
      body += `  🌡️  Temperature:   ${report.sensorData.temperature.toFixed(1)} °C\n`;
      body += `  💧  Humidity:      ${report.sensorData.humidity.toFixed(1)} %\n`;
      body += `  🌱  Soil Moisture: ${report.sensorData.soilMoisture.toFixed(1)} %\n`;
      body += `  ☀️  Light:         ${report.sensorData.lightIntensity.toFixed(0)} lux\n`;
    } else {
      body += `  📡  No sensor data in the last 12 hours.\n`;
    }

    if (report.issues.length > 0) {
      body += `\n  Issues detected:\n`;
      for (const issue of report.issues) {
        body += `    ${issue.message}\n`;
      }
    } else if (report.sensorData) {
      body += `\n  All conditions are looking great! 🎉\n`;
    }

    body += `\n${divider}\n\n`;
  }

  if (weather) {
    body += `🌤️  Weather in ${weather.location}\n\n`;
    body += `  ☁️  Condition:    ${weather.forecast} (${weather.description})\n`;
    body += `  🌡️  Temperature:  ${weather.temp} °C\n`;
    body += `  💧  Humidity:     ${weather.humidity} %\n`;

    if (weather.severe) {
      body += `\n  ⚠️  Severe weather alert! Consider protecting your outdoor plants.\n`;
    }

    body += `\n${divider}\n\n`;
  }

  body += `Stay green! 🌱\n`;
  body += `The PlantPal Team 🌿\n`;

  return body;
}

module.exports = { sendDailyReports };