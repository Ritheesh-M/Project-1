import { useNavigate } from "react-router-dom";

function InterviewPage() {
  const navigate = useNavigate();

  const data = JSON.parse(localStorage.getItem("aiResult"));
  const questions = data?.questions || [];

  return (
    <div className="container">

      <h1>INTERVIEW QUESTIONS</h1>

      {questions.length > 0 ? (
        questions.map((q, i) => (
          <div className="info-card" key={i}>
            <h3>Q{i + 1}</h3>
            <p>{q}</p>

            <textarea placeholder="Type your answer..." />
          </div>
        ))
      ) : (
        <p>No questions generated</p>
      )}

      <button onClick={() => navigate("/result")}>
        Finish → Result
      </button>

    </div>
  );
}

export default InterviewPage;