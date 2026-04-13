// Report service - sends recurring plant status emails to users with plants
const { Pool } = require("pg");
const emailService = require("./email.service");
const axios = require("axios");
const { checkPlantConditions } = require("../logic/plantCondition");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function sendDailyReports() {
  try {
    const { rows: users } = await pool.query(
      `SELECT DISTINCT p.id, p.name, p.email, p.location
      FROM profiles p
      INNER JOIN "Plant" pl ON pl."userId" = p.id
      WHERE p.email IS NOT NULL`
    );

    console.log(`Sending reports to ${users.length} users...`);

    for (const user of users) {
      await sendReportToUser(user);
    }
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
    const emailBody = buildEmailBody(user.name || "PlantPal User", plantReports, weatherInfo);

    await emailService.sendEmail({
      to: user.email,
      subject: `PlantPal Status Update - ${new Date().toLocaleString()}`,
      body: emailBody,
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
        AVG(temperature_c) AS avg_temp,
        AVG(humidity_percent) AS avg_humidity,
        AVG(soil_moisture_percent) AS avg_moisture,
        AVG(light_lux) AS avg_light,
        COUNT(*) AS reading_count
      FROM esp32_readings
      WHERE device_id = $1
      AND created_at >= $2`,
      [plant.device_id, twelveHoursAgo]
    );

    const data = rows[0];

    if (!data || Number(data.reading_count) === 0) {
      return {
        plantName: plant.plantName,
        status: "Warning: No sensor data in the last 12 hours",
        issues: [],
      };
    }

    const sensorData = {
      temperature: Number(data.avg_temp),
      humidity: Number(data.avg_humidity),
      soilMoisture: Number(data.avg_moisture),
      lightIntensity: Number(data.avg_light),
    };

    const plantWithDefaults = {
      ...plant,
      optimalMoisture: plant.optimalMoisture || 40,
      optimalLight: plant.optimalLight || 500,
      optimalTemperature: plant.optimalTemperature || 22,
    };

    const issues = checkPlantConditions(plantWithDefaults, sensorData, null);

    return {
      plantName: plant.plantName,
      status: issues.length === 0 ? "OK: All conditions normal" : "Warning: Issues detected",
      issues,
      sensorData,
    };
  } catch (err) {
    return {
      plantName: plant.plantName,
      status: `Error reading sensor data: ${err.message}`,
      issues: [],
    };
  }
}

// Always fetch and return weather info - alert if severe
async function getWeatherInfo(plant, userLocation) {
  try {
    const location = plant?.location || userLocation || "Toledo, US";

    const response = await axios.get("https://api.openweathermap.org/data/2.5/weather", {
      params: {
        q: location,
        appid: process.env.OPENWEATHER_API_KEY,
        units: "metric",
      },
    });

    const forecast = response.data.weather[0]?.main;
    const description = response.data.weather[0]?.description;
    const temp = response.data.main.temp;
    const humidity = response.data.main.humidity;
    const severeForecasts = ["Rain", "Drizzle", "Thunderstorm", "Snow", "Hurricane", "Tornado", "Extreme"];

    let weatherMsg = `Weather in ${location}:\n`;
    weatherMsg += `   - Condition: ${forecast} (${description})\n`;
    weatherMsg += `   - Temperature: ${temp} C\n`;
    weatherMsg += `   - Humidity: ${humidity}%\n`;

    if (severeForecasts.includes(forecast)) {
      weatherMsg += "\nWarning: Severe weather alert! Consider protecting your plants outdoors!";
    }

    return weatherMsg;
  } catch (err) {
    return null;
  }
}

function buildEmailBody(userName, plantReports, weatherInfo) {
  const greetingName = userName?.trim() ? `Dear ${userName.trim()},` : "Dear Plant Parent,";
  let body = `${greetingName}\n\n`;
  body += "Here is your latest PlantPal status update:\n\n";
  body += "----------------------------\n\n";

  for (const report of plantReports) {
    body += `${report.plantName}\n`;
    body += `Status: ${report.status}\n`;

    if (report.sensorData) {
      body += `   - Temperature: ${report.sensorData.temperature.toFixed(1)} C\n`;
      body += `   - Humidity: ${report.sensorData.humidity.toFixed(1)}%\n`;
      body += `   - Soil Moisture: ${report.sensorData.soilMoisture.toFixed(1)}%\n`;
      body += `   - Light: ${report.sensorData.lightIntensity.toFixed(0)} lux\n`;
    }

    if (report.issues.length > 0) {
      body += "\n   Issues:\n";
      for (const issue of report.issues) {
        body += `   ${issue.message}\n`;
      }
    }

    body += "\n----------------------------\n\n";
  }

  if (weatherInfo) {
    body += "----------------------------\n\n";
    body += `${weatherInfo}\n\n`;
    body += "----------------------------\n\n";
  }

  body += "Stay green!\nThe PlantPal Team";

  return body;
}

module.exports = { sendDailyReports };
