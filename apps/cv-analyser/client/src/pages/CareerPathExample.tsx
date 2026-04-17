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
    try {
      sessionStorage.setItem('careerPathData', JSON.stringify(payload));
      sessionStorage.setItem('careerPathPaid', 'true');
      sessionStorage.setItem('analysisLang', payload.language);
      sessionStorage.setItem('careerPathLinkedinUrl', payload.analysis.linkedin_url || '');
      // Also write to localStorage so payment-status checks pass
      localStorage.setItem('careerPathData', JSON.stringify(payload));
      localStorage.setItem('careerPathPaid', 'true');
      localStorage.setItem('analysisLang', payload.language);
    } catch (err) {
      // Silently ignore — even if storage fails the component will render
      // a friendly fallback because CareerPathResults handles missing data.
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
