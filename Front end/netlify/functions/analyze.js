const PDFParse = require("pdf-parse");
const { createWorker } = require("tesseract.js");

const SKILLS_DB = [
  "python",
  "react",
  "node",
  "express",
  "mongodb",
  "docker",
  "aws",
  "fastapi",
  "machine learning",
  "javascript",
  "typescript",
  "sql",
  "html",
  "css"
];

async function extractTextFromPDF(buffer) {
  try {
    const { data: { text } } = await PDFParse(buffer);
    if (text && text.trim().length > 0) {
      return text;
    }
  } catch (e) {
    console.log("PDF parse error, trying OCR...");
  }

  try {
    const worker = await createWorker();
    const imageBuffer = buffer;
    const { data: { text } } = await worker.recognize(imageBuffer);
    await worker.terminate();
    return text || '';
  } catch (e) {
    return '';
  }
}

function extractSkills(text, jobDescription) {
  const resumeText = text.toLowerCase();
  const jobText = jobDescription.toLowerCase();

  const matchedSkills = SKILLS_DB.filter(skill => 
    resumeText.includes(skill)
  );

  const requiredSkills = SKILLS_DB.filter(skill => 
    jobText.includes(skill)
  );

  const missingSkills = requiredSkills.filter(
    skill => !matchedSkills.includes(skill)
  );

  return {
    matched: matchedSkills,
    required: requiredSkills,
    missing: missingSkills,
    matchPercentage: Math.round(
      (matchedSkills.length / requiredSkills.length) * 100 || 0
    )
  };
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const formData = event.body;
    
    if (!formData || !formData.resume || !formData.jobDescription) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing resume or job description" })
      };
    }

    // Extract text from PDF
    const pdfBuffer = Buffer.from(formData.resume, 'base64');
    const resumeText = await extractTextFromPDF(pdfBuffer);

    if (!resumeText) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Could not extract text from PDF" })
      };
    }

    // Extract and match skills
    const skillAnalysis = extractSkills(resumeText, formData.jobDescription);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        analysis: skillAnalysis,
        resumePreview: resumeText.substring(0, 500)
      })
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Server error" })
    };
  }
};
