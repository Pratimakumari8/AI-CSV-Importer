const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    aiProvider: process.env.AI_PROVIDER || "mock",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
