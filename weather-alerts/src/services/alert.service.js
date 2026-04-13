// Alert service - orchestrates condition checks, saves alerts, sends notifications
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { checkPlantConditions } = require("../logic/plantCondition");
const emailService = require("./email.service");
const smsService = require("./sms.service");
const weatherService = require("./weather.service");

// Main function: check latest esp32 sensor data + weather, generate alerts
async function checkAndAlert(plantId) {
  // Load plant with its owner
  const plant = await prisma.plant.findUnique({
    where: { id: plantId },
    include: { user: true },
  });
  if (!plant) throw new Error(`Plant ${plantId} not found.`);

  // Get most recent reading from esp32_readings table
  const latestSensor = await prisma.$queryRaw`
    SELECT * FROM esp32_readings
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (!latestSensor || latestSensor.length === 0) {
    throw new Error(`No sensor data found in esp32_readings.`);
  }

  // Map esp32 column names to what our rules engine expects
  const sensorData = {
    temperature: latestSensor[0].temperature_c,
    humidity: latestSensor[0].humidity_percent,
    soilMoisture: latestSensor[0].soil_moisture_percent,
    lightIntensity: latestSensor[0].light_lux,
  };

  // Get latest weather (may be null if location not set)
  let latestWeather = null;
  try {
    latestWeather = await weatherService.getLatestWeather(plantId);
  } catch {
    console.warn(`No weather data available for plant ${plantId}.`);
  }

  // Run rules engine — returns array of { message, alertType }
  const issues = checkPlantConditions(plant, sensorData, latestWeather);

  if (issues.length === 0) return [];

  const createdAlerts = [];

  for (const issue of issues) {
    const deliveryMethod = plant.user.alertPreference;

    // Save alert to database
    const alert = await prisma.alert.create({
      data: {
        message: issue.message,
        alertType: issue.alertType,
        deliveryMethod,
        userId: plant.user.id,
      },
    });

    // Send the notification
    await sendNotification(plant.user, issue.message, deliveryMethod);

    createdAlerts.push(alert);
  }

  return createdAlerts;
}

// Route notification to the correct service based on user preference
async function sendNotification(user, message, deliveryMethod) {
  if (deliveryMethod === "email") {
    await emailService.sendEmail({
      to: user.email,
      subject: "PlantPal Alert 🌿",
      body: message,
    });
  } else if (deliveryMethod === "phone") {
    await smsService.sendSMS({
      to: user.phoneNumber,
      body: message,
    });
  }
}

// Return all alerts for a user, newest first
async function getAlertsForUser(userId) {
  return prisma.alert.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
  });
}

module.exports = { checkAndAlert, getAlertsForUser };