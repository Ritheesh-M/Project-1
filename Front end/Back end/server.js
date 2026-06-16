const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");

const app = express();

app.use(cors());
app.use(express.json());

// multer setup
const upload = multer({
  storage: multer.memoryStorage()
});

// skills database
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

// test route
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// MAIN AI ROUTE
app.post("/analyze", upload.single("resume"), async (req, res) => {
  try {

    // 🔥 DEBUG START
    console.log("🔥 REQUEST HIT");
    console.log("FILE RECEIVED:", req.file);

    // check file
    if (!req.file) {
      return res.json({
        error: "No file received from frontend"
      });
    }

    // parse PDF
    const data = await pdfParse(req.file.buffer);
    const resumeText = (data.text || "").toLowerCase();

    console.log("📄 RESUME LENGTH:", resumeText.length);

    if (resumeText.length < 10) {
      return res.json({
        error: "PDF not readable (maybe scanned image)"
      });
    }

    // find skills
    const found = SKILLS_DB.filter(s => resumeText.includes(s));
    const missing = SKILLS_DB.filter(s => !resumeText.includes(s));

    const score = Math.round((found.length / SKILLS_DB.length) * 100);

    const questions = missing.slice(0, 4).map(s =>
      `Explain your experience with ${s}?`
    );

    return res.json({
      score,
      found,
      missing,
      questions
    });

  } catch (err) {
    console.log("❌ ERROR:", err);

    return res.json({
      error: "Backend crashed"
    });
  }
});

// start server
app.listen(5000, () => {
  console.log("🚀 AI Server running on http://localhost:5000");
});