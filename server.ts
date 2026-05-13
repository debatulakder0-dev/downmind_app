import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import FormData from "form-data";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// Proxy for Groq AI
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages,
        response_format: { type: "json_object" },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.VITE_GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.json(response.data);
  } catch (error: any) {
    console.error("Groq Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch AI response" });
  }
});

// Proxy for ElevenLabs TTS
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
          speed: 0.82,
          style: 0.35,
        },
      },
      {
        headers: {
          "xi-api-key": process.env.VITE_ELEVEN_LABS_API_KEY,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer", // Important for audio stream
      }
    );
    res.set("Content-Type", "audio/mpeg");
    res.send(response.data);
  } catch (error: any) {
    console.error("TTS Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate speech" });
  }
});

// Proxy for ElevenLabs STT
app.post("/api/stt", express.raw({ type: "audio/wav", limit: "10mb" }), async (req, res) => {
  try {
    const form = new FormData();
    form.append("file", req.body, { filename: "audio.wav", contentType: "audio/wav" });
    form.append("model_id", "scribe_v1");

    const response = await axios.post(
      "https://api.elevenlabs.io/v1/speech-to-text",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "xi-api-key": process.env.VITE_ELEVEN_LABS_API_KEY,
        },
      }
    );
    res.json(response.data);
  } catch (error: any) {
    console.error("STT Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to transcribe audio" });
  }
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start();
