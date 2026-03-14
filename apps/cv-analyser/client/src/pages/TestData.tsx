import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function TestData() {
  const [, setLocation] = useLocation();

  const loadMockData = () => {
    const mockAnalysis = {
      atsRejectionRate: 68,
      quadrants: [
        {
          title: "Estrutura",
          score: 62,
          benchmark: 74,
          impactPhrase: "Layout pouco hierarquizado dificulta leitura rápida"
        },
        {
          title: "Conteúdo",
          score: 75,
          benchmark: 71,
          impactPhrase: "Bom uso de verbos de ação e quantificação"
        },
        {
          title: "Formação",
          score: 70,
          benchmark: 68,
          impactPhrase: "Formação bem apresentada e relevante"
        },
        {
          title: "Experiência",
          score: 58,
          benchmark: 69,
          impactPhrase: "Falta contexto de impacto nas funções anteriores"
        }
      ],
      keywords: ["Project Manager", "Agile", "Scrum", "Leadership", "Data Analysis"]
    };

    sessionStorage.setItem('cvAnalysis', JSON.stringify(mockAnalysis));
    sessionStorage.setItem('cvFile', 'mock_base64_data');
    
    setLocation('/results');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Test Data Loader</h1>
        <p className="text-muted-foreground">Load mock analysis data to test Results page</p>
        <Button onClick={loadMockData} className="bg-[#C9A961] hover:bg-[#A88B4E] text-white">
          Load Mock Data & Go to Results
        </Button>
      </div>
    </div>
  );
}
