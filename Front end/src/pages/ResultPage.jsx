function ResultPage() {
  const data = JSON.parse(localStorage.getItem("aiResult"));

  const score = data?.score || 0;
  const found = data?.found || [];
  const missing = data?.missing || [];

  return (
    <div className="container">

      <h1>FINAL RESULT</h1>

      <div className="result-card">
        <h2>ATS SCORE</h2>
        <h1>{score}%</h1>
      </div>

      <div className="info-card">
        <h3>Skills Found</h3>
        {found.map((s, i) => <p key={i}>{s}</p>)}
      </div>

      <div className="info-card">
        <h3>Missing Skills</h3>
        {missing.map((s, i) => <p key={i}>{s}</p>)}
      </div>

    </div>
  );
}

export default ResultPage;