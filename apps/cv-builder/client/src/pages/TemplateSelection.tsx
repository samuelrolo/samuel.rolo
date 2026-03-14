import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Check, Upload } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function TemplateSelection() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const templates = [
    {
      id: "black-minimalist",
      name: "Black Minimalist",
      description: "Design minimalista com sidebar preta e destaques amarelos. Ideal para engenheiros e profissionais técnicos.",
      preview: "/templates/black-minimalist-preview.png",
      features: [
        "Fotografia hexagonal",
        "Sidebar com fundo preto",
        "Barras de progresso para skills",
        "Formas geométricas decorativas"
      ]
    },
    {
      id: "green-business",
      name: "Green Business",
      description: "Design profissional com elementos verdes e timeline. Perfeito para gestores e profissionais de negócios.",
      preview: "/templates/green-business-preview.png",
      features: [
        "Fotografia circular",
        "Timeline visual de experiência",
        "Layout limpo e espaçoso",
        "Secção de referências"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-widest text-primary mb-2">
            PASSO 1 DE 3
          </p>
          <h1 className="text-4xl font-bold mb-4 text-gray-900">
            Escolha o Seu Template
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Selecione o design que melhor representa o seu perfil profissional. Poderá personalizar cores e conteúdo no próximo passo.
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {templates.map((template) => (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-xl ${
                selectedTemplate === template.id 
                  ? 'ring-2 ring-primary shadow-xl' 
                  : 'border-2 border-gray-200'
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <CardTitle className="text-2xl">{template.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {template.description}
                    </CardDescription>
                  </div>
                  {selectedTemplate === template.id && (
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Template Preview */}
                <div className="w-full h-64 bg-white rounded-lg border-2 border-gray-200 overflow-hidden mb-4">
                  {template.id === 'black-minimalist' ? (
                    <div className="h-full p-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white flex">
                      <div className="w-1/3 border-r border-yellow-500/30 pr-3">
                        <div className="w-16 h-16 bg-yellow-500 rounded-full mx-auto mb-2"></div>
                        <div className="space-y-1 text-xs">
                          <div className="h-2 bg-yellow-500/50 rounded"></div>
                          <div className="h-2 bg-gray-600 rounded w-3/4"></div>
                        </div>
                        <div className="mt-3 space-y-1">
                          <div className="h-1.5 bg-gray-600 rounded"></div>
                          <div className="h-1.5 bg-gray-600 rounded"></div>
                          <div className="h-1.5 bg-gray-600 rounded w-2/3"></div>
                        </div>
                      </div>
                      <div className="w-2/3 pl-3 text-gray-900">
                        <div className="h-3 bg-yellow-500 rounded w-1/2 mb-2"></div>
                        <div className="h-2 bg-gray-300 rounded w-1/3 mb-3"></div>
                        <div className="space-y-1">
                          <div className="h-1.5 bg-gray-300 rounded"></div>
                          <div className="h-1.5 bg-gray-300 rounded w-5/6"></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full p-4 bg-white flex">
                      <div className="w-1/3 border-r border-green-200 pr-3">
                        <div className="w-16 h-16 bg-green-600 rounded-full mx-auto mb-2"></div>
                        <div className="space-y-1 text-xs">
                          <div className="h-2 bg-green-600 rounded"></div>
                          <div className="h-2 bg-gray-300 rounded w-3/4"></div>
                        </div>
                        <div className="mt-3 space-y-1">
                          <div className="h-1.5 bg-gray-300 rounded"></div>
                          <div className="h-1.5 bg-gray-300 rounded"></div>
                        </div>
                      </div>
                      <div className="w-2/3 pl-3">
                        <div className="h-3 bg-green-600 rounded w-1/2 mb-2"></div>
                        <div className="h-2 bg-gray-300 rounded w-1/3 mb-3"></div>
                        <div className="space-y-1">
                          <div className="h-1.5 bg-gray-300 rounded"></div>
                          <div className="h-1.5 bg-gray-300 rounded w-5/6"></div>
                          <div className="h-1.5 bg-gray-300 rounded w-4/5"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <h4 className="font-semibold mb-3">Características:</h4>
                <ul className="space-y-2">
                  {template.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4">
            <Link href="/">
              <Button variant="outline" size="lg">
                Voltar
              </Button>
            </Link>
            
            <Link href={selectedTemplate ? `/editor?template=${selectedTemplate}` : "#"}>
              <Button 
                size="lg"
                disabled={!selectedTemplate}
                className="bg-primary hover:bg-primary/90"
              >
                Continuar para Editor
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">ou</p>
            <Link href="/import">
              <Button variant="outline" size="lg">
                <Upload className="mr-2 w-5 h-5" />
                Importar do LinkedIn
              </Button>
            </Link>
          </div>
        </div>

        {/* Help Text */}
        {!selectedTemplate && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Selecione um template para continuar
          </p>
        )}
      </div>
    </div>
  );
}
