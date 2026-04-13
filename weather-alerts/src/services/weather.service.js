// Weather service - calls OpenWeatherMap API and stores results
const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// Fetch current weather from API and save it to the database
async function fetchAndStoreWeather(plantId) {
  // Use raw SQL to avoid Prisma type issues
  const plants = await prisma.$queryRaw`
    SELECT * FROM "Plant" WHERE id = ${parseInt(plantId)}
  `;
  const plant = plants[0];
  if (!plant || !plant.location) {
    throw new Error(`Plant ${plantId} not found or has no location set.`);
  }

  // Call OpenWeatherMap API
  const response = await axios.get(WEATHER_BASE_URL, {
    params: {
      q: plant.location,
      appid: WEATHER_API_KEY,
      units: "metric",
    },
  });

  const raw = response.data;

  // Save weather data to database
  const weatherEntry = await prisma.weatherData.create({
    data: {
      temperature: raw.main.temp,
      humidity: raw.main.humidity,
      forecast: raw.weather[0]?.main || "Unknown",
      location: plant.location,
    },
  });

  return weatherEntry;
}

// Return the most recent stored weather for a plant's location
async function getLatestWeather(plantId) {
  const plants = await prisma.$queryRaw`
    SELECT * FROM "Plant" WHERE id = ${parseInt(plantId)}
  `;
  const plant = plants[0];
  if (!plant || !plant.location) {
    throw new Error(`Plant ${plantId} not found or has no location set.`);
  }

  const latest = await prisma.weatherData.findFirst({
    where: { location: plant.location },
    orderBy: { timestamp: "desc" },
  });

  return latest;
}

module.exports = { fetchAndStoreWeather, getLatestWeather };