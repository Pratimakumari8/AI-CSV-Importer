require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const csvRoutes = require("./routes/csvRoutes");
const healthRoutes = require("./routes/healthRoutes");
const { requestLogger } = require("./middlewares/requestLogger");
const { notFoundHandler, errorHandler } = require("./middlewares/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
  })
);
app.use(express.json({ limit: "15mb" })); // large CSVs -> large JSON row payloads
app.use(requestLogger);

// Basic rate limiting on the AI-calling endpoint to prevent runaway cost from abuse.
const importLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many import requests. Please try again later." },
});
app.use("/api/csv/import", importLimiter);

app.use("/api/health", healthRoutes);
app.use("/api/csv", csvRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`GrowEasy CSV Importer backend running on http://localhost:${PORT}`);
  console.log(`AI provider: ${process.env.AI_PROVIDER || "mock (default)"}`);
});
