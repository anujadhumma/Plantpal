# 🌿 PlantPal - Smart Plant Care Companion

An AI-powered plant monitoring web app that connects to real IoT sensors to track plant health in real time and send intelligent care alerts.

> Built as a full-stack team project at the University of Toledo

---

## What It Does

- Reads live sensor data (soil moisture, temperature, humidity, light) from a physical ESP32 device
- Displays real-time dashboards with 24-hour historical charts
- Uses AI to determine optimal growing conditions per plant type via OpenRouter API
- Sends automated email alerts at 6 AM and 6 PM with plant health status and weather advice
- Includes an AI chatbox for plant care questions, context-aware using the plant's own sensor data
- Full user authentication with email and username login, profile photo upload, and dark mode

---

## Tech Stack

Frontend | React, Vite, Tailwind CSS, Recharts 
Backend | Node.js, Express 
Database | Supabase (PostgreSQL) 
Auth | Supabase Auth 
AI | OpenRouter API (GPT-4o-mini) 
IoT Hardware | ESP32, BME280, BH1750, Soil Moisture Sensor 
Email Alerts | Nodemailer, Node-cron 
Weather | OpenWeatherMap API 

---

## How the AI Works

When a user adds a plant, the plant type is sent to the OpenRouter API which returns the ideal soil moisture, temperature, humidity, and light ranges for that specific plant. These values are saved to the database and used to trigger health alerts on the dashboard and in daily emails.

For common types like General or Other, hardcoded horticultural standards are used instead.

---

## Architecture

```
React Frontend → Supabase (Auth + Database)
              → Express Backend → OpenRouter AI
                               → OpenWeatherMap
                               → Nodemailer (email alerts)
ESP32 Sensor  → Supabase (direct sensor data upload)
```

---

## My Contributions

- Built and integrated Supabase authentication (signup, login, session management)
- Designed and implemented the full UI including dark mode, green theme, and responsive layout
- Created the real-time dashboard with live charts and health alerts
- Implemented profile management including photo upload
- Set up AI-driven optimal condition detection per plant type

---