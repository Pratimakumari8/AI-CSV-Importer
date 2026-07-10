const multer = require("multer");

const MAX_FILE_SIZE_MB = 25;

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  const isCsv =
    file.mimetype === "text/csv" ||
    file.mimetype === "application/vnd.ms-excel" ||
    file.originalname.toLowerCase().endsWith(".csv");

  if (!isCsv) {
    return cb(new Error("Only .csv files are accepted"));
  }
  cb(null, true);
}

const uploadCsv = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
}).single("file");

/** Wraps multer's callback API in middleware-friendly error handling. */
function handleCsvUpload(req, res, next) {
  uploadCsv(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file was uploaded. Use field name 'file'." });
    }
    next();
  });
}

module.exports = { handleCsvUpload };
