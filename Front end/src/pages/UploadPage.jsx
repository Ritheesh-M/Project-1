import { useState } from "react";
import { useNavigate } from "react-router-dom";

function UploadPage() {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!resume || !jobDescription) {
      alert("Please upload a PDF resume and enter job description");
      return;
    }

    // ✅ Only allow PDF files
    if (resume.type !== "application/pdf") {
      alert("Only PDF files are supported. Please upload a PDF.");
      return;
    }

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Resume = e.target.result.split(',')[1];

        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const response = await fetch(`${apiUrl}/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resume: base64Resume,
            jobDescription: jobDescription
          })
        });

        const data = await response.json();
        console.log("BACKEND RESPONSE:", data);

        if (!data || data.error) {
          alert(`Backend error: ${data.error || "Empty response"}`);
          return;
        }

        // ✅ Save AI result locally
        localStorage.setItem("aiResult", JSON.stringify(data.analysis || data));

        // Navigate to skills page
        navigate("/skills");
      };
      reader.readAsDataURL(resume);

    } catch (error) {
      console.error("UPLOAD ERROR:", error);
      alert("Backend not responding. Please check if server is running.");
    }
  };

  return (
    <div className="container">
      <h1>AI RESUME ANALYZER</h1>
      <p className="subtitle">Upload your resume and job description</p>

      {/* FILE UPLOAD */}
      <label className="upload-box">
        <input
          type="file"
          hidden
          accept="application/pdf"
          onChange={(e) => setResume(e.target.files[0])}
        />
        <div className="upload-content">
          <h2>📄 CHOOSE RESUME</h2>
          <p>Click to upload your PDF file</p>
          <span>PDF only</span>
          {resume && (
            <div className="file-name">✅ {resume.name}</div>
          )}
        </div>
      </label>

      {/* JOB DESCRIPTION */}
      <textarea
        placeholder="Paste Job Description Here..."
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
      />

      {/* BUTTON */}
      <button onClick={handleAnalyze}>🚀 Analyze Resume</button>
    </div>
  );
}

export default UploadPage;
