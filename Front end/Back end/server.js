const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");

const app = express();

app.use(cors());
app.use(express.json());

// Multer setup (store file in memory)
const upload = multer({
  storage: multer.memoryStorage()
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

// MAIN AI ROUTE
app.post("/analyze", upload.single("resume"), async (req, res) => {
  try {
    console.log("🔥 REQUEST HIT");
    console.log("FILE RECEIVED:", req.file);
    console.log("JOB DESCRIPTION:", req.body.jobDescription);

    // Check file
    if (!req.file) {
      return res.status(400).json({ error: "No file received from frontend" });
    }

    // Only allow PDFs
    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF files are supported" });
    }

    // Parse PDF
    let data;
    try {
      data = await pdfParse(req.file.buffer);
    } catch (parseErr) {
      console.log("❌ PDF PARSE ERROR:", parseErr.message);
      return res.status(400).json({ error: "Failed to parse PDF file: " + parseErr.message });
    }

    const resumeText = (data.text || "").toLowerCase();

    console.log("📄 RESUME LENGTH:", resumeText.length);

    if (resumeText.length < 10) {
      return res.status(400).json({ error: "PDF not readable (maybe scanned image)" });
    }

    // Find skills
    const found = SKILLS_DB.filter(skill =>
      resumeText.includes(skill)
    );

    const missing = SKILLS_DB.filter(skill =>
      !resumeText.includes(skill)
    );

    const score = Math.round(
      (found.length / SKILLS_DB.length) * 100
    );

    const questions = missing.slice(0, 4).map(skill =>
      `Explain your experience with ${skill}?`
    );

    // Send response
    return res.json({
      score,
      found,
      missing,
      questions,
      jobDescription: req.body.jobDescription || ""
    });

  } catch (err) {
    console.log("❌ FULL ERROR:");
    console.log(err);

    return res.status(500).json({
      error: err.message
    });
  }
});

// Start server
app.listen(5000, () => {
  console.log("🚀 AI Server running on http://localhost:5000");
});