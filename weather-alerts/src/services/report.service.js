// Report service - sends daily plant status emails to all users
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const emailService = require("./email.service");
const axios = require("axios");
const { checkPlantConditions } = require("../logic/plantCondition");

async function sendDailyReports() {
  try {
    const users = await prisma.$queryRaw`
      SELECT * FROM profiles WHERE email IS NOT NULL
    `;

    console.log(`Sending reports to ${users.length} users...`);

    for (const user of users) {
      await sendReportToUser(user);
    }

  } catch (err) {
    console.error("Error sending daily reports:", err.message);
  }
}

async function sendReportToUser(user) {
  try {
    const plants = await prisma.$queryRaw`
      SELECT * FROM "Plant" WHERE "userId" = ${user.id}::uuid
    `;

    if (!plants || plants.length === 0) {
      console.log(`No plants for user ${user.email}, skipping.`);
      return;
    }

    const plantReports = [];
    for (const plant of plants) {
      const report = await checkPlantStatus(plant);
      plantReports.push(report);
    }

    // Always get weather info
    const weatherInfo = await getWeatherInfo(plants[0], user.location);

    const emailBody = buildEmailBody(user.name, plantReports, weatherInfo);

    await emailService.sendEmail({
      to: user.email,
      subject: `🌿 PlantPal Daily Report — ${new Date().toLocaleDateString()}`,
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

    const readings = await prisma.$queryRaw`
      SELECT 
        AVG(temperature_c) as avg_temp,
        AVG(humidity_percent) as avg_humidity,
        AVG(soil_moisture_percent) as avg_moisture,
        AVG(light_lux) as avg_light,
        COUNT(*) as reading_count
      FROM esp32_readings
      WHERE device_id = ${plant.device_id}
      AND created_at >= ${twelveHoursAgo}
    `;

    const data = readings[0];

    if (!data || Number(data.reading_count) === 0) {
      return {
        plantName: plant.plantName,
        status: "⚠️ No sensor data in the last 12 hours",
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
      status: issues.length === 0 ? "✅ All conditions normal" : "⚠️ Issues detected",
      issues,
      sensorData,
    };

  } catch (err) {
    return {
      plantName: plant.plantName,
      status: "❌ Error reading sensor data",
      issues: [],
    };
  }
}

// Always fetch and return weather info — alert if severe
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

    let weatherMsg = `🌤️ Weather in ${location}:\n`;
    weatherMsg += `   • Condition: ${forecast} (${description})\n`;
    weatherMsg += `   • Temperature: ${temp}°C\n`;
    weatherMsg += `   • Humidity: ${humidity}%\n`;

    if (severeForecasts.includes(forecast)) {
      weatherMsg += `\n⚠️ Severe weather alert! Consider protecting your plants outdoors!`;
    }

    return weatherMsg;

  } catch (err) {
    return null;
  }
}

function buildEmailBody(userName, plantReports, weatherInfo) {
  const time = new Date().getHours() < 12 ? "Morning" : "Evening";
  
  let body = `Good ${time}, ${userName}!\n\n`;
  body += `Here is your PlantPal daily report:\n\n`;
  body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  for (const report of plantReports) {
    body += `🌱 ${report.plantName}\n`;
    body += `Status: ${report.status}\n`;

    if (report.sensorData) {
      body += `   • Temperature: ${report.sensorData.temperature.toFixed(1)}°C\n`;
      body += `   • Humidity: ${report.sensorData.humidity.toFixed(1)}%\n`;
      body += `   • Soil Moisture: ${report.sensorData.soilMoisture.toFixed(1)}%\n`;
      body += `   • Light: ${report.sensorData.lightIntensity.toFixed(0)} lux\n`;
    }

    if (report.issues.length > 0) {
      body += `\n   Issues:\n`;
      for (const issue of report.issues) {
        body += `   ${issue.message}\n`;
      }
    }

    body += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  }

  // Always show weather section
  if (weatherInfo) {
    body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    body += `${weatherInfo}\n\n`;
    body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  }

  body += `Stay green! 🌿\nThe PlantPal Team`;

  return body;
}

module.exports = { sendDailyReports };