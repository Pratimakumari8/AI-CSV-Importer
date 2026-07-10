const express = require("express");
const { uploadAndPreview, importRecords } = require("../controllers/csvController");
const { handleCsvUpload } = require("../middlewares/uploadMiddleware");
const { validateImportRequest } = require("../middlewares/validateImportRequest");

const router = express.Router();

// Raw multipart file upload -> parsed preview rows (no AI). Optional direct-API
// path; the frontend does this parsing client-side per the assignment's flow.
router.post("/upload", handleCsvUpload, uploadAndPreview);

// Confirmed rows -> AI-mapped CRM records, streamed as NDJSON progress + result.
router.post("/import", validateImportRequest, importRecords);

module.exports = router;
