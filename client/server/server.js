
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.GEMINI_API_KEY) {
    throw new Error(
        "Kal's AI_KEY is missing. Check your backend .env file."
    );
}


//initialize gemini.
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

// Middleware.
app.use(
    cors({
        origin: "http://localhost:5173",
    })
);

app.use(express.json({ limit: "100kb" }));

// Basic health check.
app.get("/", (req, res) => {
    res.json({
        message: "Kal's AI chatbot backend is running!",
    });
});

// Wait before retrying a failed request.
const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

// Generate a Gemini response with retries for temporary errors.

async function generateWithRetry(contents) {
    const delays = [1000, 2000, 4000];

    for (let attempt = 0; ; attempt++) {
        try {
            return await ai.models.generateContent({
                model: "gemini-3.6-flash",
                contents,
                config: {
                    systemInstruction:
                        "You are a friendly AI assistant. Answer clearly, " +
                        "accurately, and explain technical concepts step by step.",
                },
            });
        } catch (error) {
            const status = error.status || error.statusCode;
            const code = error.code || error.cause?.code;
            const message = String(error.message || "");

            const isTemporary =
                [408, 429, 500, 502, 503, 504].includes(status) ||
                [
                    "UND_ERR_CONNECT_TIMEOUT",
                    "ETIMEDOUT",
                    "ECONNRESET",
                    "ECONNREFUSED",
                    "EAI_AGAIN",
                ].includes(code) ||
                /UNAVAILABLE/i.test(message);

            if (!isTemporary || attempt >= delays.length) {
                throw error;
            }

            console.log(
                `Kal's AI temporarily unavailable. Retrying in ${delays[attempt] / 1000
                } seconds...`
            );

            await sleep(delays[attempt]);
        }
    }
}


// Chat endpoint.
app.post("/api/chat", async (req, res) => {
    try {

        // const message = req.body.message;
        // const history = req.body.history || [];
        const { message, history = [] } = req.body;

        // Validate the incoming message.
        if (typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                error: "Please enter a message.",
            });
        }

        if (message.length > 10000) {
            return res.status(400).json({
                error: "Your message is too long. Please shorten it.",
            });
        }

        // Keep only the most recent, valid chat messages.
        const safeHistory = Array.isArray(history)
            ? history
                .slice(-10)
                .filter(
                    (item) =>
                        item &&
                        ["user", "model"].includes(item.role) &&
                        typeof item.text === "string"
                )
            : [];

        // Convert chat history to Gemini's expected format.
        const contents = [
            ...safeHistory.map((item) => ({
                role: item.role,
                parts: [
                    {
                        text: item.text.slice(0, 5000),
                    },
                ],
            })),
            {
                role: "user",
                parts: [
                    {
                        text: message.trim(),
                    },
                ],
            },
        ];

        // Ask Gemini to generate a response.
        const response = await generateWithRetry(contents);

        return res.json({
            reply:
                response.text || "I couldn't generate a response. Please try again.",
        });
    } catch (error) {
        // Log detailed errors in the backend terminal.
        console.error("Gemini API error:", error);

        const status = error.status || error.statusCode;
        const code = error.code || error.cause?.code;

        const isTemporary =
            [408, 429, 500, 502, 503, 504].includes(status) ||
            [
                "UND_ERR_CONNECT_TIMEOUT",
                "ETIMEDOUT",
                "ECONNRESET",
                "ECONNREFUSED",
                "EAI_AGAIN",
            ].includes(code) ||
            /UNAVAILABLE/i.test(error.message || "");

        if (isTemporary) {
            return res.status(503).json({
                error:
                    "Kal's AI is temporarily busy. Please try again in a little while.",
            });
        }

        return res.status(500).json({
            error:
                "Something went wrong while generating a response. Check the backend terminal.",
        });
    }
});

// Handle unknown routes.
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found.",
    });
});

// Start the server.
app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});
