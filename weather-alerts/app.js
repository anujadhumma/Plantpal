require("dotenv").config();
const express = require("express");
const app = express();

app.use(express.json());

// Routes
const weatherRoutes = require("./src/routes/weather.routes");
const alertRoutes = require("./src/routes/alert.routes");

app.use("/api/weather", weatherRoutes);
app.use("/api/alerts", alertRoutes);

// Health check
app.get("/", (req, res) => res.json({ status: "PlantPal backend running" }));

// Start scheduler
require("./src/scheduler");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));