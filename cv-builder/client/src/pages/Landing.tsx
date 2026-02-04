import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 md:py-32">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-gray-900">
            O CV como reflexo claro de{" "}
            <span className="text-primary">quem és</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Cria o teu currículo profissional em minutos ou recebe feedback especializado.
            <br />
            Sem fórmulas rápidas. Apenas clareza e estratégia.
          </p>
        </div>

        {/* Main Options */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-24">
          {/* Option 1: Create Online */}
          <Card className="relative overflow-hidden border border-gray-200 hover:border-primary/50 transition-all hover:shadow-lg">
            <div className="absolute top-0 right-0 bg-primary text-black px-4 py-1 text-sm font-semibold uppercase tracking-wide">
              Novo
            </div>
            <CardHeader className="pb-4">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <FileText className="w-7 h-7 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold mb-3">Criar Currículo Online</CardTitle>
              <CardDescription className="text-base text-gray-600 leading-relaxed">
                Cria o teu currículo profissional com ferramentas simples e eficazes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Templates profissionais personalizáveis</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Importação automática do LinkedIn</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Editor drag-and-drop intuitivo</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Exportação para PDF e Word</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Personalização total de cores e layout</span>
                </li>
              </ul>
              
              <Link href="/templates">
                <Button className="w-full bg-primary hover:bg-primary/90 text-black font-semibold text-base py-6 uppercase tracking-wide">
                  Começar Agora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              
              <p className="text-sm text-center text-gray-500">
                Grátis com watermark • Premium sem watermark
              </p>
            </CardContent>
          </Card>

          {/* Option 2: Professional Review */}
          <Card className="border border-gray-200 hover:border-gray-300 transition-all hover:shadow-lg">
            <CardHeader className="pb-4">
              <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-purple-600" />
              </div>
              <CardTitle className="text-2xl font-bold mb-3">Revisão Profissional</CardTitle>
              <CardDescription className="text-base text-gray-600 leading-relaxed">
                Recebe feedback detalhado de especialistas em recrutamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Análise detalhada por profissionais</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Feedback personalizado e sugestões</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Otimização para ATS (sistemas de recrutamento)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Correção de erros e inconsistências</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Relatório completo em 24-48h</span>
                </li>
              </ul>
              
              <a href="https://share2inspire.pt/revisao-cv" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full text-base py-6 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white font-semibold uppercase tracking-wide">
                  Solicitar Revisão
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
              
              <p className="text-sm text-center text-gray-500">
                A partir de 29,99€
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values Section */}
        <div className="text-center max-w-4xl mx-auto py-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-gray-900">
            Porquê SHARE2INSPIRE?
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-gray-900" />
              </div>
              <h3 className="font-bold text-lg uppercase tracking-wide">Humanidade</h3>
              <p className="text-gray-600 leading-relaxed">
                Pessoas primeiro. Decisões conscientes, não automáticas.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-gray-900" />
              </div>
              <h3 className="font-bold text-lg uppercase tracking-wide">Confiança</h3>
              <p className="text-gray-600 leading-relaxed">
                Sem promessas vazias. Apenas opções reais que fazem sentido.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-gray-900" />
              </div>
              <h3 className="font-bold text-lg uppercase tracking-wide">Impacto</h3>
              <p className="text-gray-600 leading-relaxed">
                Crescer não é acelerar sem pensar. É saber para onde se vai e porquê.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
