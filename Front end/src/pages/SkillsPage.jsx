import { useNavigate } from "react-router-dom";

function SkillsPage() {
  const navigate = useNavigate();

  const data = JSON.parse(localStorage.getItem("aiResult"));

  const skillsFound = data?.found || [];
  const missingSkills = data?.missing || [];

  return (
    <div className="container">

      <h1>SKILLS ANALYSIS</h1>

      <div className="info-card">
        <h3>✅ Skills Found</h3>
        {skillsFound.length > 0 ? (
          skillsFound.map((skill, i) => <p key={i}>{skill}</p>)
        ) : (
          <p>No skills found</p>
        )}
      </div>

      <div className="info-card">
        <h3>❌ Missing Skills</h3>
        {missingSkills.length > 0 ? (
          missingSkills.map((skill, i) => <p key={i}>{skill}</p>)
        ) : (
          <p>No missing skills</p>
        )}
      </div>

      <button onClick={() => navigate("/interview")}>
        Next → Interview
      </button>

    </div>
  );
}

export default SkillsPage;