import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, FileText, Linkedin, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function LinkedInImport() {
  const [, setLocation] = useLocation();
  const [selectedMethod, setSelectedMethod] = useState<'oauth' | 'pdf' | 'manual' | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const parseLinkedInPDF = trpc.resume.parseLinkedInPDF.useMutation({
    onSuccess: (data) => {
      toast.success("Dados importados com sucesso!");
      // Redirect to editor with imported data
      setLocation(`/editor?template=black-minimalist&imported=true`);
    },
    onError: (error) => {
      toast.error("Erro ao processar PDF: " + error.message);
      setIsParsing(false);
    }
  });

  const getLinkedInAuthUrl = trpc.resume.getLinkedInAuthUrl.useQuery(
    {
      redirectUri: `${window.location.origin}/api/linkedin/callback`,
      state: window.location.origin, // Pass origin to redirect back after auth
    },
    {
      enabled: false, // Don't fetch automatically
    }
  );

  const handleLinkedInOAuth = async () => {
    try {
      const result = await getLinkedInAuthUrl.refetch();
      if (result.data?.authUrl) {
        // Redirect to LinkedIn OAuth
        window.location.href = result.data.authUrl;
      } else {
        toast.error("Erro ao obter URL de autorização do LinkedIn");
      }
    } catch (error: any) {
      toast.error("Erro ao iniciar OAuth: " + error.message);
    }
  };

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error("Por favor, selecione um ficheiro PDF");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("O ficheiro é demasiado grande. Máximo: 10MB");
      return;
    }

    setPdfFile(file);
  };

  const handlePDFSubmit = async () => {
    if (!pdfFile) return;

    setIsParsing(true);
    
    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const base64Data = base64.split(',')[1]; // Remove data:application/pdf;base64, prefix
      
      try {
        await parseLinkedInPDF.mutateAsync({ pdfData: base64Data });
      } catch (error) {
        console.error("Error parsing PDF:", error);
      }
    };
    reader.readAsDataURL(pdfFile);
  };

  const handleManualEntry = () => {
    setLocation('/editor?template=black-minimalist');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/templates">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Importar Dados do LinkedIn</h1>
              <p className="text-sm text-gray-500">
                Escolha como pretende importar os seus dados profissionais
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Option 1: LinkedIn OAuth */}
            <Card 
              className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedMethod === 'oauth' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedMethod('oauth')}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Linkedin className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Importação Automática</h3>
                  <p className="text-sm text-gray-600">
                    Conecte-se ao LinkedIn e importe automaticamente o seu perfil
                  </p>
                </div>
                <div className="text-xs text-gray-500 bg-yellow-50 px-3 py-1 rounded">
                  Requer configuração OAuth
                </div>
              </div>
            </Card>

            {/* Option 2: PDF Upload */}
            <Card 
              className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedMethod === 'pdf' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedMethod('pdf')}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Upload de PDF</h3>
                  <p className="text-sm text-gray-600">
                    Faça upload do PDF exportado do LinkedIn
                  </p>
                </div>
                <div className="text-xs text-primary font-medium">
                  Recomendado
                </div>
              </div>
            </Card>

            {/* Option 3: Manual Entry */}
            <Card 
              className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedMethod === 'manual' ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedMethod('manual')}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Preenchimento Manual</h3>
                  <p className="text-sm text-gray-600">
                    Preencha os seus dados manualmente no editor
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  Mais controlo
                </div>
              </div>
            </Card>
          </div>

          {/* Action Area */}
          <Card className="p-8">
            {!selectedMethod && (
              <div className="text-center text-gray-500 py-8">
                <p>Selecione um método de importação acima para continuar</p>
              </div>
            )}

            {selectedMethod === 'oauth' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Conectar ao LinkedIn</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Será redirecionado para o LinkedIn para autorizar o acesso ao seu perfil
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-sm mb-2">Dados que serão importados:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Informações pessoais (nome, email, telefone)</li>
                    <li>• Experiência profissional</li>
                    <li>• Formação académica</li>
                    <li>• Competências e recomendações</li>
                  </ul>
                </div>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                  onClick={handleLinkedInOAuth}
                >
                  <Linkedin className="w-5 h-5 mr-2" />
                  Conectar com LinkedIn
                </Button>
              </div>
            )}

            {selectedMethod === 'pdf' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Upload do PDF do LinkedIn</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Faça download do seu perfil em PDF no LinkedIn e faça upload aqui
                  </p>
                </div>
                
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {!pdfFile ? (
                    <>
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <Label htmlFor="pdf-upload" className="cursor-pointer">
                        <div className="text-sm text-gray-600 mb-2">
                          Clique para selecionar ou arraste o ficheiro PDF
                        </div>
                        <div className="text-xs text-gray-500">
                          Máximo: 10MB
                        </div>
                      </Label>
                      <Input
                        id="pdf-upload"
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={handlePDFUpload}
                      />
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <FileText className="w-6 h-6" />
                        <span className="font-medium">{pdfFile.name}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPdfFile(null)}
                      >
                        Escolher outro ficheiro
                      </Button>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2">Como obter o PDF do LinkedIn:</h4>
                  <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                    <li>Aceda ao seu perfil no LinkedIn</li>
                    <li>Clique em "Mais" → "Guardar como PDF"</li>
                    <li>Faça upload do ficheiro aqui</li>
                  </ol>
                </div>

                <Button 
                  className="w-full"
                  size="lg"
                  disabled={!pdfFile || isParsing}
                  onClick={handlePDFSubmit}
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      A processar PDF...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Importar Dados
                    </>
                  )}
                </Button>
              </div>
            )}

            {selectedMethod === 'manual' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Preenchimento Manual</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Será direcionado para o editor onde poderá preencher todos os seus dados manualmente
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-sm mb-2">Vantagens do preenchimento manual:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Controlo total sobre os dados inseridos</li>
                    <li>• Personalização completa de cada secção</li>
                    <li>• Não requer conexão com LinkedIn</li>
                    <li>• Preview em tempo real das alterações</li>
                  </ul>
                </div>
                <Button 
                  className="w-full"
                  size="lg"
                  onClick={handleManualEntry}
                >
                  Ir para o Editor
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
