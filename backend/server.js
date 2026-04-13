const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(cors());
app.use(express.json());

// Chat endpoint that forwards messages to OpenRouter AI
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    // Validate that a message was provided
    if (!userMessage) {
      return res.status(400).json({ error: "Message is required." });
    }

    // Send request to OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            // System prompt sets the AI behavior
            role: "system",
            content:
              "You are a helpful plant assistant. Give short, friendly plant care advice.",
          },
          {
            // User message from the frontend
            role: "user",
            content: userMessage,
          },
        ],
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