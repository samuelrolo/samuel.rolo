// CareerPathExample — Renders the anonymised demo report for the
// /career-path/example, /en/career-path/example and /es/career-path/example
// routes. It pre-populates sessionStorage with the example payload so the
// existing CareerPathResults page renders without requiring payment or AI
// generation.

import { useEffect, useState } from "react";
import CareerPathResults from "@/pages/CareerPathResults";
import { getLang } from "@/i18n/translations";
import { getCareerPathExample, type CareerPathExampleLang } from "@/data/careerPathExample";

export default function CareerPathExample() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const lang = (getLang() || 'pt') as CareerPathExampleLang;
    const payload = getCareerPathExample(lang);
    const analysis = (payload as any).analysis || {};
    const candidateName = analysis.candidate_name || analysis.name || 'Example Candidate';

    // CareerPathResults requires `careerPathCvAnalysis` in storage, otherwise
    // it redirects back to the Career Path home page. Provide a minimal stub
    // derived from the example payload.
    const cvAnalysisStub = {
      candidate_profile: {
        detected_name: candidateName,
        name: candidateName,
        current_role: analysis.current_role || '',
        seniority: analysis.current_positioning?.seniority_level || '',
        primary_domain: analysis.current_positioning?.primary_domain || '',
        summary: analysis.current_positioning?.market_value_assessment || '',
      },
      raw: analysis,
      analysis,
    };

    try {
      const dataStr = JSON.stringify(payload);
      const cvStr = JSON.stringify(cvAnalysisStub);
      const linkedinUrl = analysis.linkedin_url || '';
      sessionStorage.setItem('careerPathData', dataStr);
      sessionStorage.setItem('careerPathPaid', 'true');
      sessionStorage.setItem('careerPathCvAnalysis', cvStr);
      sessionStorage.setItem('analysisLang', payload.language);
      sessionStorage.setItem('careerPathLinkedinUrl', linkedinUrl);
      // Also write to localStorage so payment-status checks pass on reload
      localStorage.setItem('careerPathData', dataStr);
      localStorage.setItem('careerPathPaid', 'true');
      localStorage.setItem('careerPathCvAnalysis', cvStr);
      localStorage.setItem('analysisLang', payload.language);
      localStorage.setItem('careerPathLinkedinUrl', linkedinUrl);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[CareerPathExample] failed to seed storage', err);
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return <CareerPathResults />;
}
