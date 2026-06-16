import { BrowserRouter, Routes, Route } from "react-router-dom";
import UploadPage from "./pages/UploadPage";
import SkillsPage from "./pages/SkillsPage";
import InterviewPage from "./pages/InterviewPage";
import ResultPage from "./pages/ResultPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<UploadPage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/result" element={<ResultPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;