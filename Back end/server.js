const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");
const { createWorker } = require('tesseract.js');
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const app = express();

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Multer setup with better error handling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    console.log("📁 FILE FILTER:", file.originalname, file.mimetype);
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Only PDF files are allowed'));
    } else {
      cb(null, true);
    }
  }
});

// Skills database
const SKILLS_DB = [
  "python",
  "react",
  "node",
  "express",
  "mongodb",
  "docker",
  "aws",
  "fastapi",
  "machine learning"
];

// Test route
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Function to extract text from PDF using pdftotext (system command)
async function extractTextFromPDFWithSystem(buffer) {
  return new Promise((resolve, reject) => {
    // Write buffer to temp file
    const tempFile = path.join(os.tmpdir(), `temp_${Date.now()}.pdf`);
    const textFile = path.join(os.tmpdir(), `temp_${Date.now()}.txt`);
    
    try {
      fs.writeFileSync(tempFile, buffer);
      
      // Try pdftotext command (available on most systems)
      exec(`pdftotext "${tempFile}" "${textFile}"`, (error, stdout, stderr) => {
        try {
          if (fs.existsSync(textFile)) {
            const text = fs.readFileSync(textFile, 'utf-8');
            fs.unlinkSync(tempFile);
            fs.unlinkSync(textFile);
            resolve(text);
          } else if (error) {
            throw new Error(`pdftotext failed: ${error.message}`);
          }
        } catch (e) {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
          if (fs.existsSync(textFile)) fs.unlinkSync(textFile);
          reject(e);
        }
      });
    } catch (e) {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      reject(e);
    }
  });
}

// Primary PDF extraction using pdf-parse v2
async function extractTextFromPDF(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result?.text || "";
  } finally {
    try {
      await parser.destroy();
    } catch (destroyErr) {
      console.log("⚠️  PDFParse destroy failed:", destroyErr?.message || destroyErr);
    }
  }
}

// OCR fallback using Tesseract.js (renders first page with pdf-parse then runs OCR)
async function extractTextWithOCR(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const shot = await parser.getScreenshot({ first: 1 });
    const imageBuffer = shot && shot.pages && shot.pages[0] && shot.pages[0].data ? shot.pages[0].data : null;
    if (!imageBuffer) throw new Error('Could not render page for OCR');

    const worker = await createWorker();
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(imageBuffer);
    await worker.terminate();
    return text || '';
  } finally {
    try { await parser.destroy(); } catch (e) { /* ignore */ }
  }
}

// Fallback: Simple PDF text extraction (works for basic PDFs)
function extractTextFromPDFBasic(buffer) {
  try {
    // Convert buffer to string and extract text between parentheses
    const str = buffer.toString('latin1');
    
    // Look for text streams in PDF
    const regex = /BT[\s\S]*?ET/g;
    const matches = str.match(regex) || [];
    let text = '';
    
    for (const match of matches) {
      // Extract strings
      const stringMatches = match.match(/\((.*?)\)/g) || [];
      for (const str of stringMatches) {
        text += str.slice(1, -1) + ' '; // Remove parentheses
      }
    }
    
    return text || 'Unable to extract text';
  } catch (e) {
    return '';
  }
}

// MAIN AI ROUTE
app.post("/analyze", upload.single("resume"), async (req, res) => {
  try {
    console.log("\n🔥 REQUEST HIT");
    console.log("📋 FILE INFO:", req.file ? { name: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype } : "NO FILE");
    console.log("📝 JOB DESCRIPTION:", req.body.jobDescription?.substring(0, 50) || "NONE");

    // Check file exists
    if (!req.file) {
      console.log("❌ ERROR: No file uploaded");
      return res.status(400).json({ error: "No file received. Please upload a PDF resume." });
    }

    // Check file size
    if (req.file.size === 0) {
      console.log("❌ ERROR: File is empty");
      return res.status(400).json({ error: "Uploaded file is empty. Please upload a valid PDF." });
    }

    // Verify MIME type
    if (req.file.mimetype !== "application/pdf") {
      console.log("❌ ERROR: Invalid MIME type:", req.file.mimetype);
      return res.status(400).json({ error: "Invalid file type. Only PDF files are supported." });
    }

    // Parse PDF
    console.log("📄 Parsing PDF...");
    let resumeText = "";
    let parseError = null;

    try {
      resumeText = await extractTextFromPDF(req.file.buffer);
      if (!resumeText || resumeText.length < 5) {
        throw new Error("pdf-parse returned no text");
      }
      console.log("✅ Extracted using pdf-parse");
    } catch (pdfParseErr) {
      parseError = pdfParseErr;
      console.log("⚠️  pdf-parse failed:", pdfParseErr.message);
      try {
        resumeText = await extractTextFromPDFWithSystem(req.file.buffer);
        if (!resumeText || resumeText.length < 5) {
          throw new Error("pdftotext returned no text");
        }
        console.log("✅ Extracted using pdftotext fallback");
      } catch (sysErr) {
        console.log("⚠️  pdftotext failed, trying basic extraction:", sysErr.message);
        // Try basic extraction
        resumeText = extractTextFromPDFBasic(req.file.buffer);
        if (!resumeText || resumeText.length < 5 || resumeText === "Unable to extract text") {
          // Try OCR as a final fallback (useful for scanned PDFs)
          try {
            console.log('🔎 Trying OCR fallback...');
            resumeText = await extractTextWithOCR(req.file.buffer);
            if (!resumeText || resumeText.length < 5) throw new Error('OCR returned no text');
            console.log('✅ Extracted using OCR fallback');
          } catch (ocrErr) {
            const message = pdfParseErr?.message || sysErr?.message || ocrErr?.message || "Could not extract text from PDF.";
            console.log("❌ PDF PARSE ERROR:", message);
            return res.status(400).json({ error: "Cannot parse PDF: " + message });
          }
        }
      }
    }

    resumeText = (resumeText || "").toLowerCase().trim();

    console.log("📄 RESUME LENGTH:", resumeText.length, "characters");

    if (resumeText.length < 10) {
      console.log("❌ ERROR: Resume text too short");
      return res.status(400).json({ error: "PDF appears to be empty or unreadable. Try uploading a different PDF." });
    }

    // Find skills
    const found = SKILLS_DB.filter(skill =>
      resumeText.includes(skill.toLowerCase())
    );

    const missing = SKILLS_DB.filter(skill =>
      !resumeText.includes(skill.toLowerCase())
    );

    const score = Math.round(
      (found.length / SKILLS_DB.length) * 100
    );

    const questions = missing.slice(0, 4).map(skill =>
      `Explain your experience with ${skill}?`
    );

    console.log("✅ ANALYSIS COMPLETE - Score:", score, "Found skills:", found.length);

    // Send response
    return res.json({
      score,
      found,
      missing,
      questions,
      jobDescription: req.body.jobDescription || ""
    });

  } catch (err) {
    console.log("\n❌ UNEXPECTED ERROR IN /analyze:");
    console.log("Error message:", err.message);
    console.log("Error stack:", err.stack);

    // Check if response was already sent
    if (res.headersSent) {
      console.log("⚠️  Response already sent, cannot send error response");
      return;
    }

    return res.status(500).json({
      error: "Server error: " + (err.message || "Unknown error occurred")
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found: " + req.path });
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.log("\n❌ GLOBAL ERROR HANDLER:");
  console.log("Error message:", err.message);
  console.log("Error stack:", err.stack);

  // Check if headers already sent
  if (res.headersSent) {
    console.log("⚠️  Headers already sent, passing to default handler");
    return next(err);
  }

  res.status(err.status || 500).json({
    error: "Server error: " + (err.message || "Unknown error")
  });
});

// Start server with error handling
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 AI Server running on http://localhost:${PORT}`);
  console.log("✅ CORS enabled for all origins");
  console.log("✅ PDF extraction ready");
  console.log("✅ Ready to receive resume uploads\n");
});

// Handle server errors
server.on('error', (err) => {
  console.log("❌ SERVER ERROR:", err);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.log('❌ UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('❌ UNCAUGHT EXCEPTION:', err);
  // Don't exit, try to keep server running
});