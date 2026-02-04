import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Save, Upload, GripVertical, Plus, Trash2, ShoppingCart } from "lucide-react";
import { Link, useLocation } from "wouter";
import { BlackMinimalistTemplate } from "@/components/templates/BlackMinimalistTemplate";
import { GreenBusinessTemplate } from "@/components/templates/GreenBusinessTemplate";
import { BASE_RESUME_TEMPLATE, type ResumeData } from "@shared/resume-types";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useExportPDF } from "@/hooks/useExportPDF";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Experience Item
function SortableExperienceItem({ 
  exp, 
  index, 
  updateExperience, 
  removeExperience 
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: exp.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4 bg-gray-50 relative">
      <div className="flex items-start gap-2">
        <button
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded mt-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Experiência {index + 1}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeExperience(exp.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div>
            <Label>Empresa</Label>
            <Input 
              value={exp.company}
              onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
            />
          </div>
          <div>
            <Label>Cargo</Label>
            <Input 
              value={exp.position}
              onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Data Início</Label>
              <Input 
                value={exp.startDate}
                onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                placeholder="2020-01"
              />
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input 
                value={exp.endDate || ''}
                onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                placeholder="Presente"
              />
            </div>
          </div>
          <div>
            <Label>Descrição (uma linha por responsabilidade)</Label>
            <Textarea 
              value={exp.description || ''}
              onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
              rows={4}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

// Sortable Education Item
function SortableEducationItem({ 
  edu, 
  index, 
  updateEducation, 
  removeEducation 
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: edu.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4 bg-gray-50 relative">
      <div className="flex items-start gap-2">
        <button
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded mt-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Formação {index + 1}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeEducation(edu.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div>
            <Label>Instituição</Label>
            <Input 
              value={edu.institution}
              onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)}
            />
          </div>
          <div>
            <Label>Grau</Label>
            <Input 
              value={edu.degree}
              onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
            />
          </div>
          <div>
            <Label>Área de Estudo</Label>
            <Input 
              value={edu.field || ''}
              onChange={(e) => updateEducation(edu.id, 'field', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Data Início</Label>
              <Input 
                value={edu.startDate}
                onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                placeholder="2015-09"
              />
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input 
                value={edu.endDate || ''}
                onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                placeholder="2019-07"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Sortable Skill Item
function SortableSkillItem({ 
  skill, 
  index, 
  updateSkill, 
  removeSkill 
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: skill.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4 bg-gray-50 relative">
      <div className="flex items-start gap-2">
        <button
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded mt-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Skill {index + 1}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeSkill(skill.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div>
            <Label>Nome da Skill</Label>
            <Input 
              value={skill.name}
              onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
            />
          </div>
          <div>
            <Label>Nível (1-5)</Label>
            <Input 
              type="number"
              min="1"
              max="5"
              value={skill.level}
              onChange={(e) => updateSkill(skill.id, 'level', parseInt(e.target.value))}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function CVEditor() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1]);
  const templateId = params.get('template') || 'black-minimalist';
  
  const [resumeData, setResumeData] = useState<ResumeData>(BASE_RESUME_TEMPLATE);
  const [activeTab, setActiveTab] = useState("personal");
  const { exportToPDF } = useExportPDF();
  const { user } = useAuth();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load saved resume if exists
  const { data: savedResumes } = trpc.resume.list.useQuery();
  
  const saveResumeMutation = trpc.resume.create.useMutation({
    onSuccess: () => {
      toast.success("Currículo guardado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao guardar: " + error.message);
    }
  });

  const handleSave = () => {
    saveResumeMutation.mutate({
      title: `${resumeData.personalInfo.fullName} - CV`,
      data: resumeData,
      templateId: templateId,
    });
  };

  const updatePersonalInfo = (field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  const updateExperience = (id: string, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map((exp) => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const addExperience = () => {
    const newExp = {
      id: `exp-${Date.now()}`,
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }));
  };

  const removeExperience = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const updateEducation = (id: string, field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.map((edu) => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const addEducation = () => {
    const newEdu = {
      id: `edu-${Date.now()}`,
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: ''
    };
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, newEdu]
    }));
  };

  const removeEducation = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }));
  };

  const updateSkill = (id: string, field: string, value: string | number) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.map((skill) => 
        skill.id === id ? { ...skill, [field]: value } : skill
      )
    }));
  };

  const addSkill = () => {
    const newSkill = {
      id: `skill-${Date.now()}`,
      name: '',
      level: 3
    };
    setResumeData(prev => ({
      ...prev,
      skills: [...prev.skills, newSkill]
    }));
  };

  const removeSkill = (id: string) => {
    setResumeData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.id !== id)
    }));
  };

  // Handle drag end for experiences
  const handleExperienceDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setResumeData((prev) => {
        const oldIndex = prev.experience.findIndex((item) => item.id === active.id);
        const newIndex = prev.experience.findIndex((item) => item.id === over.id);
        
        return {
          ...prev,
          experience: arrayMove(prev.experience, oldIndex, newIndex),
        };
      });
    }
  };

  // Handle drag end for education
  const handleEducationDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setResumeData((prev) => {
        const oldIndex = prev.education.findIndex((item) => item.id === active.id);
        const newIndex = prev.education.findIndex((item) => item.id === over.id);
        
        return {
          ...prev,
          education: arrayMove(prev.education, oldIndex, newIndex),
        };
      });
    }
  };

  // Handle drag end for skills
  const handleSkillsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setResumeData((prev) => {
        const oldIndex = prev.skills.findIndex((item) => item.id === active.id);
        const newIndex = prev.skills.findIndex((item) => item.id === over.id);
        
        return {
          ...prev,
          skills: arrayMove(prev.skills, oldIndex, newIndex),
        };
      });
    }
  };

  const renderTemplate = () => {
    switch (templateId) {
      case 'green-business':
        return <GreenBusinessTemplate data={resumeData} />;
      case 'black-minimalist':
      default:
        return <BlackMinimalistTemplate data={resumeData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/templates">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Editor de Currículo</h1>
                <p className="text-sm text-gray-500">
                  Template: {templateId === 'black-minimalist' ? 'Black Minimalist' : 'Green Business'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Guardar
              </Button>
              {user && (
                <Link href="/checkout">
                  <Button variant="outline" size="sm">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Comprar Créditos
                  </Button>
                </Link>
              )}
              <Button 
                size="sm" 
                className="bg-primary"
                onClick={() => exportToPDF('cv-preview', `${resumeData.personalInfo.fullName}-CV.pdf`, !user, true)}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Editor Panel */}
          <div className="space-y-6">
            <Card className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-4 mb-6">
                  <TabsTrigger value="personal">Pessoal</TabsTrigger>
                  <TabsTrigger value="experience">Experiência</TabsTrigger>
                  <TabsTrigger value="education">Educação</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                </TabsList>

                {/* Personal Info Tab */}
                <TabsContent value="personal" className="space-y-4">
                  <div>
                    <Label>Nome Completo</Label>
                    <Input 
                      value={resumeData.personalInfo.fullName}
                      onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                      placeholder="João Silva"
                    />
                  </div>
                  <div>
                    <Label>Cargo/Título</Label>
                    <Input 
                      value={resumeData.personalInfo.title}
                      onChange={(e) => updatePersonalInfo('title', e.target.value)}
                      placeholder="Engenheiro de Software"
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input 
                      value={resumeData.personalInfo.phone}
                      onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                      placeholder="+351 912 345 678"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input 
                      type="email"
                      value={resumeData.personalInfo.email}
                      onChange={(e) => updatePersonalInfo('email', e.target.value)}
                      placeholder="joao.silva@email.com"
                    />
                  </div>
                  <div>
                    <Label>Morada</Label>
                    <Input 
                      value={resumeData.personalInfo.address || ''}
                      onChange={(e) => updatePersonalInfo('address', e.target.value)}
                      placeholder="Lisboa, Portugal"
                    />
                  </div>
                  <div>
                    <Label>Website/LinkedIn</Label>
                    <Input 
                      value={resumeData.personalInfo.website || ''}
                      onChange={(e) => updatePersonalInfo('website', e.target.value)}
                      placeholder="linkedin.com/in/joaosilva"
                    />
                  </div>
                  <div>
                    <Label>Sobre Mim / Perfil Profissional</Label>
                    <Textarea 
                      value={resumeData.summary || ''}
                      onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                      placeholder="Breve descrição do seu perfil profissional..."
                      rows={4}
                    />
                  </div>
                </TabsContent>

                {/* Experience Tab with Drag & Drop */}
                <TabsContent value="experience" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-500">Arraste para reordenar</p>
                    <Button onClick={addExperience} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Experiência
                    </Button>
                  </div>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleExperienceDragEnd}
                  >
                    <SortableContext
                      items={resumeData.experience.map(exp => exp.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4">
                        {resumeData.experience.map((exp, index) => (
                          <SortableExperienceItem
                            key={exp.id}
                            exp={exp}
                            index={index}
                            updateExperience={updateExperience}
                            removeExperience={removeExperience}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </TabsContent>

                {/* Education Tab with Drag & Drop */}
                <TabsContent value="education" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-500">Arraste para reordenar</p>
                    <Button onClick={addEducation} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Formação
                    </Button>
                  </div>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleEducationDragEnd}
                  >
                    <SortableContext
                      items={resumeData.education.map(edu => edu.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4">
                        {resumeData.education.map((edu, index) => (
                          <SortableEducationItem
                            key={edu.id}
                            edu={edu}
                            index={index}
                            updateEducation={updateEducation}
                            removeEducation={removeEducation}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </TabsContent>

                {/* Skills Tab with Drag & Drop */}
                <TabsContent value="skills" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-500">Arraste para reordenar</p>
                    <Button onClick={addSkill} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Skill
                    </Button>
                  </div>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleSkillsDragEnd}
                  >
                    <SortableContext
                      items={resumeData.skills.map(skill => skill.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4">
                        {resumeData.skills.map((skill, index) => (
                          <SortableSkillItem
                            key={skill.id}
                            skill={skill}
                            index={index}
                            updateSkill={updateSkill}
                            removeSkill={removeSkill}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="lg:sticky lg:top-24 h-fit">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Preview</h2>
              <div 
                id="cv-preview" 
                className="bg-white shadow-lg mx-auto overflow-hidden"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  transform: 'scale(0.5)',
                  transformOrigin: 'top center',
                }}
              >
                {renderTemplate()}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
