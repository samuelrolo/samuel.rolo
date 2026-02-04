import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DEFAULT_VISUAL_CONFIG, 
  DESIGN_PACKS, 
  COLOR_SCHEME_LABELS, 
  TYPOGRAPHY_LABELS, 
  ICON_STYLE_LABELS,
  VisualConfig,
  LayoutType,
  ColorScheme,
  Typography,
  IconStyle,
  DesignPack
} from "@shared/visual-config-types";
import { BASE_RESUME_TEMPLATE } from "@shared/resume-types";
import { DEFAULT_SECTIONS } from "@shared/section-types";
import { ModularTemplate } from "@/components/templates/ModularTemplate";
import { ArrowRight, Palette, Type, Layout, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function TemplateCustomization() {
  const [, setLocation] = useLocation();
  const [visualConfig, setVisualConfig] = useState<VisualConfig>(DEFAULT_VISUAL_CONFIG);
  const [selectedTab, setSelectedTab] = useState<string>("packs");

  const createResumeMutation = trpc.resume.create.useMutation({
    onSuccess: (data) => {
      toast.success("Currículo criado com sucesso!");
      setLocation(`/editor/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Erro ao criar currículo: ${error.message}`);
    },
  });

  const handlePackSelect = (packId: DesignPack) => {
    if (packId === "custom") {
      setVisualConfig({ ...DEFAULT_VISUAL_CONFIG, designPack: "custom" });
    } else {
      const pack = DESIGN_PACKS[packId];
      setVisualConfig({
        ...visualConfig,
        designPack: packId,
        layout: pack.layout,
        colorScheme: pack.colorScheme,
        typography: pack.typography,
        iconStyle: pack.iconStyle,
      });
    }
  };

  const handleCreateResume = () => {
    createResumeMutation.mutate({
      templateId: "modular-template",
      title: "Meu Currículo",
      data: {
        ...BASE_RESUME_TEMPLATE,
        visualConfig,
        sections: DEFAULT_SECTIONS,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Personalize o Seu Currículo</h1>
          <p className="text-gray-600">
            Escolha um pack pronto ou personalize cada elemento individualmente
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Preview */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-lg shadow-lg p-4 sticky top-4">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="font-semibold text-lg">Pré-visualização</h2>
                <span className="text-sm text-gray-500">Escala: 50%</span>
              </div>
              <div className="overflow-auto max-h-[calc(100vh-200px)] border rounded">
                <div style={{ transform: "scale(0.5)", transformOrigin: "top left", width: "200%" }}>
                  <ModularTemplate
                    data={BASE_RESUME_TEMPLATE}
                    visualConfig={visualConfig}
                    sections={DEFAULT_SECTIONS}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Customization Panel */}
          <div className="order-1 lg:order-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personalização Visual</CardTitle>
                <CardDescription>
                  Configure o design do seu currículo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="packs">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Packs
                    </TabsTrigger>
                    <TabsTrigger value="layout">
                      <Layout className="w-4 h-4 mr-1" />
                      Layout
                    </TabsTrigger>
                    <TabsTrigger value="colors">
                      <Palette className="w-4 h-4 mr-1" />
                      Cores
                    </TabsTrigger>
                    <TabsTrigger value="typography">
                      <Type className="w-4 h-4 mr-1" />
                      Texto
                    </TabsTrigger>
                  </TabsList>

                  {/* Packs Tab */}
                  <TabsContent value="packs" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      {Object.entries(DESIGN_PACKS).map(([key, pack]) => (
                        <Card
                          key={key}
                          className={`cursor-pointer transition-all ${
                            visualConfig.designPack === key
                              ? "border-blue-500 border-2 bg-blue-50"
                              : "hover:border-gray-400"
                          }`}
                          onClick={() => handlePackSelect(key as DesignPack)}
                        >
                          <CardHeader className="p-4">
                            <CardTitle className="text-base">{pack.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {pack.description}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Layout Tab */}
                  <TabsContent value="layout" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Tipo de Layout</Label>
                      <Select
                        value={visualConfig.layout}
                        onValueChange={(value) =>
                          setVisualConfig({ ...visualConfig, layout: value as LayoutType, designPack: "custom" })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single-column">Uma Coluna</SelectItem>
                          <SelectItem value="two-column">Duas Colunas</SelectItem>
                          <SelectItem value="sidebar">Sidebar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  {/* Colors Tab */}
                  <TabsContent value="colors" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Esquema de Cores</Label>
                      <Select
                        value={visualConfig.colorScheme}
                        onValueChange={(value) =>
                          setVisualConfig({ ...visualConfig, colorScheme: value as ColorScheme, designPack: "custom" })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(COLOR_SCHEME_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  {/* Typography Tab */}
                  <TabsContent value="typography" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Tipografia</Label>
                      <Select
                        value={visualConfig.typography}
                        onValueChange={(value) =>
                          setVisualConfig({ ...visualConfig, typography: value as Typography, designPack: "custom" })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TYPOGRAPHY_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Estilo de Ícones</Label>
                      <Select
                        value={visualConfig.iconStyle}
                        onValueChange={(value) =>
                          setVisualConfig({ ...visualConfig, iconStyle: value as IconStyle, designPack: "custom" })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ICON_STYLE_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
              onClick={handleCreateResume}
              disabled={createResumeMutation.isPending}
            >
              {createResumeMutation.isPending ? "A criar..." : "Continuar para o Editor"}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
