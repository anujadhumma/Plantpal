const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.BACKEND_PORT || 3000;

// Middleware setup
app.use(cors());
app.use(express.json());

// Chat endpoint that forwards messages to OpenRouter AI
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    const chatMode = req.body.chatMode || "general";
    const selectedPlant = req.body.selectedPlant || null;
    const plantReadings = Array.isArray(req.body.plantReadings) ? req.body.plantReadings : [];

    // Validate that a message was provided
    if (!userMessage) {
      return res.status(400).json({ error: "Message is required." });
    }

    const messages = [
      {
        role: "system",
        content:
          chatMode === "plant" && selectedPlant
            ? [
                "You are a helpful plant assistant.",
                "The user is asking about one specific plant from their own account.",
                "Use the provided plant profile and sensor history when answering.",
                "Prioritize the most recent readings, but use the older readings to notice trends.",
                "If the data is missing or stale, say that clearly.",
                "Give short, friendly, practical plant care advice.",
              ].join(" ")
            : "You are a helpful plant assistant. Give short, friendly plant care advice.",
      },
    ];

    if (chatMode === "plant" && selectedPlant) {
      messages.push({
        role: "system",
        content: `Selected plant profile: ${JSON.stringify(selectedPlant)}`,
      });
      messages.push({
        role: "system",
        content: `Selected plant sensor history: ${JSON.stringify(plantReadings)}`,
      });
    }

    messages.push({
      role: "user",
      content: userMessage,
    });

    // Send request to OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages,
      }),
    });

    const data = await response.json();

    // Handle non-OK responses from OpenRouter
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenRouter request failed",
      });
    }

    // Extract the AI reply from the response
    const reply =
      data.choices?.[0]?.message?.content || "No response from model.";

    res.json({ reply });
  } catch (error) {
    // Log and return any unexpected server errors
    console.error("Server error:", error);
    res.status(500).json({ error: "Something went wrong on the server." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
