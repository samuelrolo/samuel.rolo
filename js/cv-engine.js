/**
 * CV Engine - Share2Inspire (Versão 2.0 - Análise Robusta)
 * Sistema completo de análise de CV com extração real de dados
 * Integração com PDF.js e Mammoth.js
 */
window.CV_ENGINE = {
    data: {
        maturity: { score: 0, label: 'Em Análise' },
        // Novos fatores claros para o spider
        spiderFactors: {
            estrutura: 0,      // Organização e clareza do CV
            conteudo: 0,       // Qualidade e relevância do conteúdo
            impacto: 0,        // Resultados quantificáveis
            formacao: 0,       // Formação académica e contínua
            experiencia: 0,    // Anos e qualidade da experiência
            competencias: 0    // Hard e soft skills identificadas
        },
        // Análise ATS isolada
        atsAnalysis: {
            score: 0,
            level: '',
            bullets: []
        },
        // Dados extraídos do CV
        extractedData: {
            name: '',
            currentRole: '',
            yearsExperience: 0,
            seniorityLevel: '',
            mainArea: '',
            experiences: [],
            education: [],
            certifications: [],
            hardSkills: [],
            softSkills: [],
            languages: [],
            contacts: {
                email: '',
                phone: '',
                linkedin: '',
                location: ''
            }
        },
        rawText: "",
        originalText: "" // Texto sem lowercase para extração de nomes
    },

    // Dicionários expandidos para análise
    dictionaries: {
        // Verbos de ação e impacto
        impactVerbs: {
            pt: ['liderei', 'aumentei', 'crescimento', 'roi', 'kpi', 'budget', 'poupança', 'implementei',
                'estratégia', 'geriu', 'lancei', 'otimizei', 'desenvolvi', 'criei', 'reduzi', 'melhorei',
                'coordenei', 'supervisionei', 'negociei', 'alcancei', 'excedi', 'transformei', 'automatizei'],
            en: ['led', 'increased', 'growth', 'roi', 'kpi', 'budget', 'savings', 'implemented',
                'strategy', 'managed', 'launched', 'optimized', 'developed', 'created', 'reduced', 'improved',
                'coordinated', 'supervised', 'negotiated', 'achieved', 'exceeded', 'transformed', 'automated',
                'driving', 'leading', 'delivering', 'enhancing', 'representing']
        },
        // Secções estruturais
        sections: {
            pt: ['experiência', 'educação', 'formação', 'contactos', 'resumo', 'skills', 'competências',
                'línguas', 'certificações', 'perfil', 'objetivo', 'sobre mim'],
            en: ['experience', 'education', 'training', 'contacts', 'summary', 'skills', 'competencies',
                'languages', 'certifications', 'profile', 'objective', 'about me', 'professional experience',
                'areas of expertise', 'relevant training']
        },
        // Keywords ATS por área
        atsKeywords: {
            hr: ['hr', 'human resources', 'recursos humanos', 'talent', 'recruitment', 'recrutamento',
                'performance', 'training', 'formação', 'compensation', 'benefits', 'hris', 'payroll',
                'employee', 'workforce', 'organizational', 'change management', 'transformation'],
            tech: ['software', 'development', 'programming', 'agile', 'scrum', 'devops', 'cloud',
                'data', 'analytics', 'machine learning', 'ai', 'python', 'javascript', 'sql'],
            management: ['project', 'management', 'gestão', 'leadership', 'liderança', 'team', 'equipa',
                'strategy', 'estratégia', 'budget', 'planning', 'execution', 'delivery'],
            consulting: ['consulting', 'consultoria', 'advisory', 'client', 'stakeholder', 'analysis',
                'recommendation', 'implementation', 'transformation', 'optimization']
        },
        // Soft skills
        softSkills: {
            pt: ['comunicação', 'liderança', 'trabalho em equipa', 'resolução de problemas', 'criatividade',
                'adaptabilidade', 'gestão de tempo', 'negociação', 'pensamento crítico', 'empatia'],
            en: ['communication', 'leadership', 'teamwork', 'problem solving', 'creativity',
                'adaptability', 'time management', 'negotiation', 'critical thinking', 'empathy',
                'collaboration', 'organizational', 'strategic thinking']
        },
        // Níveis de senioridade
        seniorityIndicators: {
            junior: ['junior', 'júnior', 'trainee', 'estagiário', 'intern', 'entry', 'assistant'],
            mid: ['analyst', 'analista', 'consultant', 'consultor', 'specialist', 'especialista'],
            senior: ['senior', 'sénior', 'lead', 'principal', 'expert'],
            manager: ['manager', 'gestor', 'supervisor', 'coordinator', 'coordenador', 'head'],
            director: ['director', 'diretor', 'vp', 'vice president', 'chief', 'ceo', 'cfo', 'cto', 'chro', 'partner']
        }
    },

    /**
     * Função principal de análise
     */
    async analyzeFile(file) {
        try {
            console.log('[CV_ENGINE] Iniciando análise:', file.name, file.type);

            // Extrair texto do ficheiro
            if (file.type === 'application/pdf') {
                const result = await this.readPDF(file);
                this.data.rawText = result.toLowerCase();
                this.data.originalText = result;
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                const result = await this.readDOCX(file);
                this.data.rawText = result.toLowerCase();
                this.data.originalText = result;
            } else {
                throw new Error('Formato não suportado. Utilize PDF ou DOCX.');
            }

            // 1. Validar que é um CV e não outro tipo de documento
            this.validateDocumentType(this.data.rawText, this.data.originalText);

            // 2. Extrair dados estruturados do CV
            this.extractAllData();

            // 3. Calcular scores dos fatores do spider
            this.calculateSpiderFactors();

            // 4. Calcular análise ATS isolada
            this.calculateATSAnalysis();

            // 5. Calcular maturidade global
            this.calculateMaturityScore();

            // 6. INTEGRAÇÃO GEMINI AI: Análise avançada com backend
            await this.callGeminiBackend(file);

            // 7. Atualizar UI (agora com dados Gemini incluídos)
            this.updateUI();

            console.log('[CV_ENGINE] Análise completa:', this.data);
            console.log('[CV_ENGINE] Análise Gemini:', this.geminiAnalysis);
            return true;
        } catch (error) {
            console.error('[CV_ENGINE] Erro na análise:', error);
            throw error;
        }
    },

    /**
     * Leitura de PDF usando PDF.js
     */
    async readPDF(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(" ") + "\n";
        }

        return text;
    },

    /**
     * Leitura de DOCX usando Mammoth.js
     */
    async readDOCX(file) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        return result.value;
    },

    /**
     * INTEGRAÇÃO GEMINI AI: Chamar backend para análise avançada
     */
    async callGeminiBackend(file) {
        // CORRECTED: Use App Engine endpoint instead of non-existent Cloud Function
        const GEMINI_BACKEND_URL = 'https://share2inspire-beckend.lm.r.appspot.com/api/services/analyze-cv';

        console.log('[GEMINI] 🔍 CHECKPOINT 1: Iniciando callGeminiBackend');
        console.log('[GEMINI] 📤 Enviando CV para análise IA...');
        console.log('[GEMINI] 📋 Ficheiro:', file.name, '- Tamanho:', Math.round(file.size / 1024), 'KB');
        console.log('[GEMINI] 🌐 Endpoint:', GEMINI_BACKEND_URL);

        try {
            // Criar FormData com o ficheiro
            const formData = new FormData();
            formData.append('cv_file', file);

            // Chamar backend Gemini com timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const response = await fetch(GEMINI_BACKEND_URL, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.warn('[GEMINI] ⚠️ Erro do backend (HTTP', response.status, '):', errorText);
                // Fallback: usar análise local se backend falhar
                this.geminiAnalysis = null;
                return;
            }

            const responseData = await response.json();
            console.log('[GEMINI] ✅ Análise recebida com sucesso!');
            
            // Extrair report do wrapper de resposta
            const report = responseData.report || responseData;
            
            // Mapear dados para o formato esperado pelo frontend
            const geminiData = {
                summary: report.executive_summary?.three_sentences?.join(' ') || '',
                strengths: [],
                dimensions: report.dimensions || {},
                candidate_profile: report.candidate_profile || {},
                roadmap: report.roadmap || {},
                final_verdict: report.final_verdict || {},
                premium_indicators: report.premium_indicators || {}
            };
            
            // Extrair pontos fortes das dimensões com score alto
            if (report.dimensions) {
                Object.entries(report.dimensions).forEach(([key, dim]) => {
                    if (dim && dim.signal && dim.score >= 14) {
                        geminiData.strengths.push(dim.signal);
                    }
                });
            }
            
            // Se não houver strengths das dimensões, usar primeira frase do summary
            if (geminiData.strengths.length === 0 && report.executive_summary?.three_sentences) {
                geminiData.strengths.push(report.executive_summary.three_sentences[0]);
            }
            
            console.log('[GEMINI] 📊 Dados mapeados:', {
                hasSummary: !!geminiData.summary,
                hasStrengths: !!geminiData.strengths,
                strengthsCount: geminiData.strengths?.length || 0
            });

            // Guardar dados Gemini para uso no updateUI
            this.geminiAnalysis = geminiData;

        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn('[GEMINI] ⏱️ Timeout: Backend demorou mais de 30s');
            } else {
                console.warn('[GEMINI] ❌ Erro ao chamar backend:', error.message);
            }
            console.warn('[GEMINI] 🔄 Usando análise local como fallback');
            // Fallback: continuar sem dados Gemini
            this.geminiAnalysis = null;
        }
    },

    /**
     * EXTRAÇÃO COMPLETA DE DADOS DO CV
     */
    extractAllData() {
        const text = this.data.rawText;
        const originalText = this.data.originalText;

        // Extrair nome (primeira linha ou padrão de nome)
        this.extractName(originalText);

        // Extrair contactos
        this.extractContacts(text, originalText);

        // Extrair experiências profissionais
        this.extractExperiences(text, originalText);

        // Extrair formação
        this.extractEducation(text, originalText);

        // Extrair certificações
        this.extractCertifications(text, originalText);

        // Extrair competências
        this.extractSkills(text);

        // Extrair idiomas
        this.extractLanguages(text, originalText);

        // Determinar área principal e senioridade
        this.determineMainAreaAndSeniority();
    },

    /**
     * Extrair nome do candidato
     */
    extractName(text) {
        // Tentar encontrar nome no início do documento
        const lines = text.split('\n').filter(l => l.trim().length > 0);

        // Padrão 1: Nome em MAIÚSCULAS com espaços (ex: S A M U E L  R O L O)
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i].trim();

            // Verificar se é nome com letras separadas por espaços
            if (/^[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ](\s+[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ])+/.test(line)) {
                // Remover espaços extras e reconstruir nome
                const cleanName = line.replace(/\s+/g, '').split('').join('');
                // Separar por grupos de maiúsculas consecutivas que formam palavras
                const words = line.split(/\s{2,}/).map(w => w.replace(/\s/g, ''));
                if (words.length >= 2) {
                    this.data.extractedData.name = words
                        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                        .join(' ');
                    break;
                }
            }

            // Padrão 2: Nome normal (2-5 palavras)
            const words = line.split(/\s+/);
            if (words.length >= 2 && words.length <= 5) {
                const isName = words.every(w => /^[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]*$/.test(w) ||
                    /^[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ]+$/.test(w));
                if (isName || line === line.toUpperCase()) {
                    this.data.extractedData.name = words
                        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                        .join(' ');
                    break;
                }
            }
        }

        // Fallback: procurar padrão de nome no texto
        if (!this.data.extractedData.name) {
            // Procurar por "Nome Apelido" no início de linhas
            const nameMatch = text.match(/^([A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+\s+){1,3}[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+/m);
            if (nameMatch) {
                this.data.extractedData.name = nameMatch[0];
            } else {
                this.data.extractedData.name = 'Candidato';
            }
        }
    },

    /**
     * Extrair contactos
     */
    extractContacts(text, originalText) {
        // Email - padrão mais restritivo
        const emailMatch = originalText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
            this.data.extractedData.contacts.email = emailMatch[0];
        }

        // Telefone (formato português com ou sem espaços)
        const phonePatterns = [
            /(?:\+351\s?)?9[1236]\d\s?\d{3}\s?\d{3}/,  // Com espaços: 961 925 050
            /(?:\+351\s?)?9[1236]\d{7}/,                // Sem espaços: 961925050
            /(?:\(\+351\)\s?)?9[1236]\d\s?\d{3}\s?\d{3}/ // Com parênteses
        ];

        for (const pattern of phonePatterns) {
            const phoneMatch = originalText.match(pattern);
            if (phoneMatch) {
                this.data.extractedData.contacts.phone = phoneMatch[0].replace(/\s/g, '');
                break;
            }
        }

        // LinkedIn - vários formatos
        const linkedinPatterns = [
            /linkedin\.com\/in\/[\w.-]+/i,
            /linkedin\.com\/[\w.-]+/i,
            /in\/[\w.-]+(?=\s|$)/i  // Formato curto: in/samuelrolo
        ];

        for (const pattern of linkedinPatterns) {
            const linkedinMatch = originalText.match(pattern);
            if (linkedinMatch) {
                let linkedin = linkedinMatch[0];
                // Normalizar para formato completo
                if (!linkedin.includes('linkedin.com')) {
                    linkedin = 'linkedin.com/' + linkedin;
                }
                this.data.extractedData.contacts.linkedin = linkedin;
                break;
            }
        }

        // Localização
        const locationPatterns = [
            /(?:lisboa|porto|coimbra|braga|faro|aveiro|setúbal|leiria|évora|viseu|viana|beja|bragança|castelo branco|guarda|portalegre|santarém|vila real)(?:[,\s]+portugal)?/gi,
            /portugal/gi,
            /(?:mafra|sintra|cascais|oeiras|almada|amadora|loures|odivelas)/gi
        ];

        for (const pattern of locationPatterns) {
            const match = text.match(pattern);
            if (match) {
                this.data.extractedData.contacts.location = match[0].charAt(0).toUpperCase() + match[0].slice(1);
                break;
            }
        }
    },

    /**
     * Extrair experiências profissionais
     */
    extractExperiences(text, originalText) {
        const experiences = [];

        // Padrões de datas (2020-2024, 01/2020 - 05/2024, etc.)
        const datePattern = /(\d{1,2}\/)?(\d{4})\s*[-–]\s*(\d{1,2}\/)?(\d{4}|presente|atual|current|present)/gi;
        const matches = [...originalText.matchAll(datePattern)];

        // Empresas conhecidas
        const knownCompanies = [
            'google', 'microsoft', 'amazon', 'deloitte', 'ey', 'pwc', 'kpmg', 'accenture',
            'mckinsey', 'bcg', 'bain', 'salesforce', 'oracle', 'ibm', 'sap', 'cisco',
            'meta', 'facebook', 'apple', 'netflix', 'bnp paribas', 'hsbc', 'santander',
            'galp', 'edp', 'nos', 'meo', 'vodafone', 'sonae', 'jerónimo martins',
            'siemens', 'bosch', 'continental', 'mercedes', 'volkswagen', 'bmw'
        ];

        // Encontrar empresas mencionadas
        const foundCompanies = [];
        for (const company of knownCompanies) {
            if (text.includes(company)) {
                foundCompanies.push(company.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
            }
        }

        // Calcular anos de experiência
        let totalYears = 0;
        const currentYear = new Date().getFullYear();

        matches.forEach(match => {
            const startYear = parseInt(match[2]);
            let endYear = match[4];

            if (endYear.toLowerCase() === 'presente' || endYear.toLowerCase() === 'atual' ||
                endYear.toLowerCase() === 'current' || endYear.toLowerCase() === 'present') {
                endYear = currentYear;
            } else {
                endYear = parseInt(endYear);
            }

            if (startYear && endYear && endYear >= startYear) {
                const years = endYear - startYear;
                totalYears += years;

                experiences.push({
                    period: `${startYear} - ${endYear === currentYear ? 'Presente' : endYear}`,
                    years: years
                });
            }
        });

        this.data.extractedData.experiences = experiences;
        this.data.extractedData.yearsExperience = Math.max(1, totalYears);

        // Guardar empresas encontradas
        this.data.extractedData.topCompanies = foundCompanies.slice(0, 5);
    },

    /**
     * Extrair formação académica
     */
    extractEducation(text, originalText) {
        const education = [];

        // Instituições de ensino conhecidas
        const institutions = [
            'nova school of business', 'nova sbe', 'iscte', 'iseg', 'católica', 'católica lisbon',
            'universidade de lisboa', 'universidade do porto', 'universidade de coimbra',
            'universidade do minho', 'universidade de aveiro', 'universidade nova',
            'ibs', 'business school', 'mba', 'mestrado', 'licenciatura', 'doutoramento',
            'bachelor', 'master', 'degree', 'phd', 'executive programme', 'executive program'
        ];

        // Graus académicos
        const degrees = {
            'doutoramento': 'Doutoramento',
            'phd': 'PhD',
            'mestrado': 'Mestrado',
            'master': 'Mestrado',
            'mba': 'MBA',
            'pós-graduação': 'Pós-Graduação',
            'postgraduate': 'Pós-Graduação',
            'licenciatura': 'Licenciatura',
            'bachelor': 'Licenciatura',
            'degree': 'Licenciatura',
            'executive programme': 'Programa Executivo',
            'executive program': 'Programa Executivo'
        };

        // Encontrar graus mencionados
        for (const [key, value] of Object.entries(degrees)) {
            if (text.includes(key)) {
                education.push({
                    degree: value,
                    found: true
                });
            }
        }

        // Encontrar instituições
        const foundInstitutions = [];
        for (const inst of institutions) {
            if (text.includes(inst)) {
                foundInstitutions.push(inst.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
            }
        }

        this.data.extractedData.education = education;
        this.data.extractedData.institutions = [...new Set(foundInstitutions)].slice(0, 3);

        // Verificar última data de formação
        const yearMatches = text.match(/\b(20[0-2][0-9])\b/g);
        if (yearMatches) {
            const years = yearMatches.map(y => parseInt(y)).sort((a, b) => b - a);
            this.data.extractedData.lastEducationYear = years[0];
        }
    },

    /**
     * Extrair certificações
     */
    extractCertifications(text, originalText) {
        const certifications = [];

        // Certificações comuns
        const certPatterns = [
            { pattern: /pmp/i, name: 'PMP (Project Management Professional)' },
            { pattern: /scrum master|psm/i, name: 'Scrum Master' },
            { pattern: /agile/i, name: 'Agile Certified' },
            { pattern: /six sigma/i, name: 'Six Sigma' },
            { pattern: /itil/i, name: 'ITIL' },
            { pattern: /aws/i, name: 'AWS Certified' },
            { pattern: /azure/i, name: 'Azure Certified' },
            { pattern: /google cloud/i, name: 'Google Cloud Certified' },
            { pattern: /sap/i, name: 'SAP Certified' },
            { pattern: /successfactors|sf|sap sf/i, name: 'SAP SuccessFactors' },
            { pattern: /servicenow|sn hr/i, name: 'ServiceNow' },
            { pattern: /generative ai|gen ai/i, name: 'Generative AI' },
            { pattern: /shrm/i, name: 'SHRM Certified' },
            { pattern: /cipd/i, name: 'CIPD' }
        ];

        for (const cert of certPatterns) {
            if (cert.pattern.test(text)) {
                certifications.push(cert.name);
            }
        }

        this.data.extractedData.certifications = [...new Set(certifications)];
    },

    /**
     * Extrair competências (hard e soft skills)
     */
    extractSkills(text) {
        const hardSkills = [];
        const softSkills = [];

        // Hard skills por área
        const hardSkillPatterns = {
            'Gestão de Projetos': /project management|gestão de projetos|pm/i,
            'Análise de Dados': /data analysis|análise de dados|analytics/i,
            'HRIS/SAP': /hris|sap|successfactors|workday/i,
            'Excel Avançado': /excel|spreadsheet/i,
            'Power BI': /power bi|powerbi|tableau/i,
            'Change Management': /change management|gestão da mudança/i,
            'Transformação Digital': /digital transformation|transformação digital/i,
            'Recrutamento': /recruitment|recrutamento|talent acquisition/i,
            'Formação e Desenvolvimento': /training|formação|learning|development/i,
            'Compensação e Benefícios': /compensation|benefits|compensação|benefícios/i,
            'Relações Laborais': /labor relations|relações laborais/i,
            'Org Design': /organizational design|org design|desenho organizacional/i,
            'Process Design': /process design|desenho de processos/i,
            'ERP': /erp|enterprise resource/i,
            'Scrum/Agile': /scrum|agile|kanban/i
        };

        for (const [skill, pattern] of Object.entries(hardSkillPatterns)) {
            if (pattern.test(text)) {
                hardSkills.push(skill);
            }
        }

        // Soft skills
        const softSkillPatterns = {
            'Liderança': /leadership|liderança|liderei|led/i,
            'Comunicação': /communication|comunicação/i,
            'Trabalho em Equipa': /teamwork|team work|trabalho em equipa|equipa/i,
            'Resolução de Problemas': /problem solving|resolução de problemas/i,
            'Pensamento Estratégico': /strategic|estratégico|strategy/i,
            'Negociação': /negotiation|negociação/i,
            'Gestão de Stakeholders': /stakeholder|stakeholders/i,
            'Adaptabilidade': /adaptability|adaptabilidade|change/i,
            'Orientação para Resultados': /results|resultados|kpi|roi/i,
            'Gestão de Tempo': /time management|gestão de tempo/i
        };

        for (const [skill, pattern] of Object.entries(softSkillPatterns)) {
            if (pattern.test(text)) {
                softSkills.push(skill);
            }
        }

        this.data.extractedData.hardSkills = [...new Set(hardSkills)].slice(0, 10);
        this.data.extractedData.softSkills = [...new Set(softSkills)].slice(0, 8);
    },

    /**
     * Extrair idiomas
     */
    extractLanguages(text, originalText) {
        const languages = [];

        const languagePatterns = [
            { lang: 'Português', patterns: ['português', 'portuguese', 'native', 'nativo'], levels: ['nativo', 'native', 'fluente', 'fluent', 'c2', 'c1'] },
            { lang: 'Inglês', patterns: ['inglês', 'english'], levels: ['c2', 'c1', 'b2', 'b1', 'a2', 'fluente', 'fluent', 'advanced', 'avançado', 'upper intermediate', 'intermediate', 'básico', 'basic'] },
            { lang: 'Espanhol', patterns: ['espanhol', 'spanish', 'castellano', 'español'], levels: ['c2', 'c1', 'b2', 'b1', 'a2', 'fluente', 'avançado', 'intermédio', 'básico', 'fluent', 'advanced', 'intermediate', 'basic'] },
            { lang: 'Francês', patterns: ['francês', 'french', 'français'], levels: ['c2', 'c1', 'b2', 'b1', 'a2', 'fluente', 'avançado', 'intermédio', 'básico', 'fluent', 'advanced', 'intermediate', 'basic'] },
            { lang: 'Alemão', patterns: ['alemão', 'german', 'deutsch'], levels: ['c2', 'c1', 'b2', 'b1', 'a2', 'fluente', 'avançado', 'intermédio', 'básico', 'fluent', 'advanced', 'intermediate', 'basic'] },
            { lang: 'Italiano', patterns: ['italiano', 'italian'], levels: ['c2', 'c1', 'b2', 'b1', 'a2', 'fluente', 'avançado', 'intermédio', 'básico'] },
            { lang: 'Polaco', patterns: ['polaco', 'polish', 'polski'], levels: ['c2', 'c1', 'b2', 'b1', 'a2', 'fluente', 'avançado', 'intermédio', 'básico', 'native', 'nativo'] },
            { lang: 'Russo', patterns: ['russo', 'russian', 'русский'], levels: ['c2', 'c1', 'b2', 'b1', 'a2', 'fluente', 'avançado', 'intermédio', 'básico', 'native', 'nativo'] },
            { lang: 'Chinês', patterns: ['chinês', 'chinese', 'mandarin', 'mandarim', '中文'], levels: ['fluente', 'avançado', 'intermédio', 'básico', 'native', 'nativo', 'fluent'] },
            { lang: 'Japonês', patterns: ['japonês', 'japanese', '日本語'], levels: ['fluente', 'avançado', 'intermédio', 'básico', 'native', 'nativo', 'n1', 'n2', 'n3', 'n4', 'n5'] },
            { lang: 'Árabe', patterns: ['árabe', 'arabic', 'العربية'], levels: ['fluente', 'avançado', 'intermédio', 'básico', 'native', 'nativo'] },
            { lang: 'Holandês', patterns: ['holandês', 'dutch', 'nederlands'], levels: ['c2', 'c1', 'b2', 'b1', 'a2', 'fluente', 'avançado', 'intermédio', 'básico'] },
            { lang: 'Sueco', patterns: ['sueco', 'swedish', 'svenska'], levels: ['c2', 'c1', 'b2', 'b1', 'a2', 'fluente', 'avançado', 'intermédio', 'básico'] },
            { lang: 'Norueguês', patterns: ['norueguês', 'norwegian', 'norsk'], levels: ['c2', 'c1', 'b2', 'b1', 'a2', 'fluente', 'avançado', 'intermédio', 'básico'] },
            { lang: 'Dinamarquês', patterns: ['dinamarquês', 'danish', 'dansk'], levels: ['c2', 'c1', 'b2', 'b1', 'a2', 'fluente', 'avançado', 'intermédio', 'básico'] },
            { lang: 'Coreano', patterns: ['coreano', 'korean', '한국어'], levels: ['fluente', 'avançado', 'intermédio', 'básico', 'native', 'nativo'] },
            { lang: 'Hindi', patterns: ['hindi', 'हिन्दी'], levels: ['fluente', 'avançado', 'intermédio', 'básico', 'native', 'nativo'] },
            { lang: 'Romeno', patterns: ['romeno', 'romanian', 'română'], levels: ['c2', 'c1', 'b2', 'b1', 'a2', 'fluente', 'avançado', 'intermédio', 'básico', 'native', 'nativo'] },
            { lang: 'Checo', patterns: ['checo', 'czech', 'čeština'], levels: ['c2', 'c1', 'b2', 'b1', 'a2', 'fluente', 'avançado', 'intermédio', 'básico'] },
            { lang: 'Grego', patterns: ['grego', 'greek', 'ελληνικά'], levels: ['c2', 'c1', 'b2', 'b1', 'a2', 'fluente', 'avançado', 'intermédio', 'básico'] }
        ];

        for (const langInfo of languagePatterns) {
            const hasLang = langInfo.patterns.some(p => text.includes(p));
            if (hasLang) {
                let level = 'Não especificado';
                for (const lvl of langInfo.levels) {
                    if (text.includes(lvl)) {
                        level = lvl.charAt(0).toUpperCase() + lvl.slice(1);
                        break;
                    }
                }
                languages.push({ name: langInfo.lang, level: level });
            }
        }

        this.data.extractedData.languages = languages;
    },

    /**
     * Determinar área principal e nível de senioridade
     */
    determineMainAreaAndSeniority() {
        const text = this.data.rawText;

        // Determinar área principal
        const areas = {
            'Recursos Humanos': /human resources|recursos humanos|hr |rh |talent|people|employee/gi,
            'Gestão e Liderança': /management|gestão|leadership|liderança|director|manager/gi,
            'Consultoria': /consulting|consultoria|advisory|consultant|consultor/gi,
            'Tecnologia': /technology|tecnologia|software|developer|engineer|it /gi,
            'Finanças': /finance|finanças|financial|accounting|contabilidade/gi,
            'Marketing': /marketing|digital marketing|brand|comunicação/gi,
            'Vendas': /sales|vendas|comercial|business development/gi,
            'Operações': /operations|operações|supply chain|logistics/gi
        };

        let maxCount = 0;
        let mainArea = 'Profissional';

        for (const [area, pattern] of Object.entries(areas)) {
            const matches = text.match(pattern);
            const count = matches ? matches.length : 0;
            if (count > maxCount) {
                maxCount = count;
                mainArea = area;
            }
        }

        this.data.extractedData.mainArea = mainArea;

        // Determinar senioridade
        const years = this.data.extractedData.yearsExperience;
        const seniorityKeywords = this.dictionaries.seniorityIndicators;

        let seniority = 'Profissional';

        // Verificar por keywords primeiro
        for (const [level, keywords] of Object.entries(seniorityKeywords)) {
            if (keywords.some(k => text.includes(k))) {
                if (level === 'director') seniority = 'Direção/Executivo';
                else if (level === 'manager') seniority = 'Gestão';
                else if (level === 'senior') seniority = 'Sénior';
                else if (level === 'mid') seniority = 'Intermédio';
                else if (level === 'junior') seniority = 'Júnior/Iniciante';
            }
        }

        // Ajustar por anos de experiência se não houver indicadores claros
        if (seniority === 'Profissional') {
            if (years >= 15) seniority = 'Direção/Executivo';
            else if (years >= 10) seniority = 'Gestão';
            else if (years >= 6) seniority = 'Sénior';
            else if (years >= 3) seniority = 'Intermédio';
            else seniority = 'Júnior/Iniciante';
        }

        this.data.extractedData.seniorityLevel = seniority;

        // Extrair função atual (procurar após "Currently" ou primeira experiência)
        const currentRolePatterns = [
            /currently\s*[\n\r]*([^\n\r]+)/i,
            /present\s*[\n\r]*([^\n\r]+)/i,
            /atual\s*[\n\r]*([^\n\r]+)/i
        ];

        for (const pattern of currentRolePatterns) {
            const match = this.data.originalText.match(pattern);
            if (match) {
                this.data.extractedData.currentRole = match[1].trim().substring(0, 50);
                break;
            }
        }

        if (!this.data.extractedData.currentRole) {
            this.data.extractedData.currentRole = mainArea;
        }
    },

    /**
     * CALCULAR FATORES DO SPIDER (6 dimensões claras)
     */
    calculateSpiderFactors() {
        const text = this.data.rawText;
        const data = this.data.extractedData;

        // 1. ESTRUTURA (0-100): Organização e clareza do CV
        let estrutura = 0;
        const allSections = [...this.dictionaries.sections.pt, ...this.dictionaries.sections.en];
        const sectionsFound = allSections.filter(s => text.includes(s)).length;
        estrutura += Math.min(40, sectionsFound * 8); // Até 40 pontos por secções

        // Verificar contactos completos
        if (data.contacts.email) estrutura += 15;
        if (data.contacts.phone) estrutura += 15;
        if (data.contacts.linkedin) estrutura += 15;
        if (data.contacts.location) estrutura += 5;

        // Tamanho adequado
        const wordCount = text.split(/\s+/).length;
        if (wordCount >= 200 && wordCount <= 800) estrutura += 10;
        else if (wordCount > 800) estrutura += 5;

        this.data.spiderFactors.estrutura = Math.min(100, estrutura);

        // 2. CONTEÚDO (0-100): Qualidade e relevância
        let conteudo = 0;

        // Nome identificado
        if (data.name && data.name !== 'Candidato') conteudo += 15;

        // Experiências detalhadas
        conteudo += Math.min(30, data.experiences.length * 10);

        // Formação presente
        conteudo += Math.min(20, data.education.length * 10);

        // Competências identificadas
        conteudo += Math.min(20, (data.hardSkills.length + data.softSkills.length) * 2);

        // Idiomas
        conteudo += Math.min(15, data.languages.length * 5);

        this.data.spiderFactors.conteudo = Math.min(100, conteudo);

        // 3. IMPACTO (0-100): Resultados quantificáveis
        let impacto = 0;

        // Verbos de ação
        const allImpactVerbs = [...this.dictionaries.impactVerbs.pt, ...this.dictionaries.impactVerbs.en];
        const impactVerbsFound = allImpactVerbs.filter(v => text.includes(v)).length;
        impacto += Math.min(50, impactVerbsFound * 5);

        // Métricas numéricas (%, €, números)
        const metricsPattern = /(\d+%|\d+[\.,]\d+|\d+k|\d+m|\$|€|£|\d+\s*(mil|million|billion))/gi;
        const metricsFound = (text.match(metricsPattern) || []).length;
        impacto += Math.min(50, metricsFound * 10);

        this.data.spiderFactors.impacto = Math.min(100, impacto);

        // 4. FORMAÇÃO (0-100): Formação académica e contínua
        let formacao = 0;

        // Grau académico
        if (data.education.some(e => e.degree === 'Doutoramento' || e.degree === 'PhD')) formacao += 40;
        else if (data.education.some(e => e.degree === 'Mestrado' || e.degree === 'MBA')) formacao += 35;
        else if (data.education.some(e => e.degree === 'Pós-Graduação')) formacao += 30;
        else if (data.education.some(e => e.degree === 'Licenciatura')) formacao += 25;
        else if (data.education.length > 0) formacao += 20;

        // Instituições de prestígio
        const prestigeInst = ['nova', 'católica', 'iscte', 'iseg'];
        if (data.institutions && data.institutions.some(i => prestigeInst.some(p => i.toLowerCase().includes(p)))) {
            formacao += 20;
        }

        // Certificações
        formacao += Math.min(30, data.certifications.length * 10);

        // Atualização recente (últimos 3 anos)
        const currentYear = new Date().getFullYear();
        if (data.lastEducationYear && (currentYear - data.lastEducationYear) <= 3) {
            formacao += 10;
        }

        this.data.spiderFactors.formacao = Math.min(100, formacao);

        // 5. EXPERIÊNCIA (0-100): Anos e qualidade
        let experiencia = 0;

        // Anos de experiência
        const years = data.yearsExperience;
        if (years >= 15) experiencia += 40;
        else if (years >= 10) experiencia += 35;
        else if (years >= 6) experiencia += 30;
        else if (years >= 3) experiencia += 20;
        else experiencia += 10;

        // Empresas de prestígio
        if (data.topCompanies && data.topCompanies.length > 0) {
            experiencia += Math.min(30, data.topCompanies.length * 10);
        }

        // Progressão de carreira (múltiplas experiências)
        experiencia += Math.min(30, data.experiences.length * 6);

        this.data.spiderFactors.experiencia = Math.min(100, experiencia);

        // 6. COMPETÊNCIAS (0-100): Hard e soft skills
        let competencias = 0;

        // Hard skills
        competencias += Math.min(50, data.hardSkills.length * 7);

        // Soft skills
        competencias += Math.min(30, data.softSkills.length * 5);

        // Idiomas (além do nativo)
        const additionalLanguages = data.languages.filter(l => l.level !== 'Nativo' && l.level !== 'Native');
        competencias += Math.min(20, additionalLanguages.length * 10);

        this.data.spiderFactors.competencias = Math.min(100, competencias);
    },

    /**
     * ANÁLISE ATS ISOLADA (0-100) COM BULLETS POR NÍVEL
     */
    calculateATSAnalysis() {
        const text = this.data.rawText;
        const data = this.data.extractedData;
        let score = 0;
        const triggers = [];

        // 1. Formato e estrutura parseável (25 pontos)
        let formatScore = 0;

        // Contactos claros
        if (data.contacts.email) {
            formatScore += 8;
            triggers.push({ positive: true, text: 'Email de contacto presente e legível' });
        } else {
            triggers.push({ positive: false, text: 'Email de contacto não detetado' });
        }

        if (data.contacts.phone) {
            formatScore += 7;
            triggers.push({ positive: true, text: 'Número de telefone identificado' });
        } else {
            triggers.push({ positive: false, text: 'Telefone não encontrado no documento' });
        }

        // Secções standard
        const standardSections = ['experience', 'education', 'skills', 'experiência', 'formação', 'competências'];
        const sectionsFound = standardSections.filter(s => text.includes(s)).length;
        formatScore += Math.min(10, sectionsFound * 3);

        if (sectionsFound >= 3) {
            triggers.push({ positive: true, text: 'Secções principais bem identificadas' });
        } else {
            triggers.push({ positive: false, text: 'Faltam secções standard (Experiência, Formação, Competências)' });
        }

        score += formatScore;

        // 2. Keywords relevantes (35 pontos)
        let keywordScore = 0;

        // Determinar área e verificar keywords
        const area = data.mainArea.toLowerCase();
        let relevantKeywords = [];

        if (area.includes('recursos humanos') || area.includes('hr')) {
            relevantKeywords = this.dictionaries.atsKeywords.hr;
        } else if (area.includes('tecnologia')) {
            relevantKeywords = this.dictionaries.atsKeywords.tech;
        } else if (area.includes('consultoria')) {
            relevantKeywords = this.dictionaries.atsKeywords.consulting;
        } else {
            relevantKeywords = this.dictionaries.atsKeywords.management;
        }

        const keywordsFound = relevantKeywords.filter(k => text.includes(k)).length;
        keywordScore = Math.min(35, Math.round((keywordsFound / relevantKeywords.length) * 35));

        if (keywordsFound >= 8) {
            triggers.push({ positive: true, text: `${keywordsFound} keywords relevantes da área identificadas` });
        } else if (keywordsFound >= 4) {
            triggers.push({ positive: true, text: `Keywords parcialmente presentes (${keywordsFound} encontradas)` });
        } else {
            triggers.push({ positive: false, text: 'Baixa densidade de keywords relevantes para a área' });
        }

        score += keywordScore;

        // 3. Verbos de ação (20 pontos)
        let verbScore = 0;
        const allVerbs = [...this.dictionaries.impactVerbs.pt, ...this.dictionaries.impactVerbs.en];
        const verbsFound = allVerbs.filter(v => text.includes(v)).length;
        verbScore = Math.min(20, verbsFound * 2);

        if (verbsFound >= 8) {
            triggers.push({ positive: true, text: 'Uso forte de verbos de ação e impacto' });
        } else if (verbsFound >= 4) {
            triggers.push({ positive: true, text: 'Verbos de ação presentes mas podem ser reforçados' });
        } else {
            triggers.push({ positive: false, text: 'Faltam verbos de ação (liderei, implementei, aumentei, etc.)' });
        }

        score += verbScore;

        // 4. Datas e cronologia (10 pontos)
        let dateScore = 0;
        if (data.experiences.length >= 2) {
            dateScore += 10;
            triggers.push({ positive: true, text: 'Cronologia profissional clara e parseável' });
        } else if (data.experiences.length === 1) {
            dateScore += 5;
            triggers.push({ positive: false, text: 'Cronologia limitada - adicionar mais datas de experiência' });
        } else {
            triggers.push({ positive: false, text: 'Datas de experiência não detetadas pelo parser' });
        }

        score += dateScore;

        // 5. Comprimento adequado (10 pontos)
        const wordCount = text.split(/\s+/).length;
        if (wordCount >= 300 && wordCount <= 800) {
            score += 10;
            triggers.push({ positive: true, text: 'Comprimento do CV adequado para leitura ATS' });
        } else if (wordCount < 300) {
            score += 3;
            triggers.push({ positive: false, text: 'CV muito curto - ATS pode considerar incompleto' });
        } else {
            score += 5;
            triggers.push({ positive: false, text: 'CV extenso - considerar versão mais concisa' });
        }

        // Determinar nível e bullets específicos
        this.data.atsAnalysis.score = Math.min(100, score);

        // Classificar nível
        let level, levelBullets;

        if (score < 25) {
            level = 'Muito Baixa';
            levelBullets = [
                'O CV tem alta probabilidade de ser rejeitado por sistemas ATS',
                'Estrutura não segue padrões reconhecíveis por software de triagem',
                'Recomenda-se reformulação completa com foco em keywords e formato standard'
            ];
        } else if (score < 50) {
            level = 'Baixa';
            levelBullets = [
                'O CV pode passar alguns filtros mas será penalizado em rankings',
                'Keywords insuficientes para a área de especialização',
                'Adicionar secções claras e verbos de ação para melhorar parsing'
            ];
        } else if (score < 75) {
            level = 'Média';
            levelBullets = [
                'O CV tem estrutura aceitável para a maioria dos sistemas ATS',
                'Existe margem para otimização de keywords específicas',
                'Reforçar métricas quantificáveis para destacar resultados'
            ];
        } else if (score < 90) {
            level = 'Elevada';
            levelBullets = [
                'O CV está bem otimizado para sistemas de triagem automática',
                'Keywords e estrutura alinhadas com boas práticas ATS',
                'Pequenos ajustes podem elevar para nível excepcional'
            ];
        } else {
            level = 'Excepcional';
            levelBullets = [
                'O CV está excelentemente preparado para sistemas ATS',
                'Estrutura, keywords e formato seguem as melhores práticas',
                'Alta probabilidade de passar filtros automáticos com sucesso'
            ];
        }

        this.data.atsAnalysis.level = level;
        this.data.atsAnalysis.levelBullets = levelBullets;
        this.data.atsAnalysis.triggers = triggers;
    },

    /**
     * Calcular score de maturidade global (escala 0-100)
     */
    calculateMaturityScore() {
        const factors = this.data.spiderFactors;

        // Média ponderada dos fatores
        const weights = {
            estrutura: 0.15,
            conteudo: 0.15,
            impacto: 0.20,
            formacao: 0.15,
            experiencia: 0.20,
            competencias: 0.15
        };

        let weightedSum = 0;
        for (const [factor, weight] of Object.entries(weights)) {
            weightedSum += factors[factor] * weight;
        }

        // Escala 0-100
        const score = Math.round(weightedSum);
        this.data.maturity.score = score;

        // Definir label baseado na escala 0-100
        if (score >= 80) this.data.maturity.label = 'Especialista';
        else if (score >= 60) this.data.maturity.label = 'Avançado';
        else if (score >= 40) this.data.maturity.label = 'Intermédio';
        else this.data.maturity.label = 'Iniciante';
    },

    /**
     * ATUALIZAR UI COM DADOS REAIS EXTRAÍDOS
     */
    updateUI() {
        const data = this.data.extractedData;
        const factors = this.data.spiderFactors;
        const ats = this.data.atsAnalysis;

        // BLOCO 1: Retrato Profissional
        const yearsExp = document.getElementById('yearsExp');
        const mainArea = document.getElementById('mainArea');
        const seniorityLevel = document.getElementById('seniorityLevel');

        if (yearsExp) {
            const years = data.yearsExperience;
            if (years <= 2) yearsExp.textContent = '0-2 anos';
            else if (years <= 5) yearsExp.textContent = '3-5 anos';
            else if (years <= 10) yearsExp.textContent = '6-10 anos';
            else if (years <= 15) yearsExp.textContent = '11-15 anos';
            else yearsExp.textContent = '15+ anos';
        }
        if (mainArea) mainArea.textContent = data.mainArea;
        if (seniorityLevel) seniorityLevel.textContent = data.seniorityLevel;

        // BLOCO 2: Maturidade Profissional (escala 0-100 com barra de progresso)
        const maturityScore = document.getElementById('maturityScore');
        const maturityLabel = document.getElementById('maturityLabel');
        const maturityProgressBar = document.getElementById('maturityProgressBar');

        if (maturityScore) maturityScore.textContent = this.data.maturity.score;
        if (maturityLabel) maturityLabel.textContent = this.data.maturity.label;

        // Animar barra de progresso da maturidade
        if (maturityProgressBar) {
            setTimeout(() => {
                maturityProgressBar.style.width = this.data.maturity.score + '%';
            }, 100);
        }

        // NOVO: Animar 4 Barras Verticais Douradas
        const barEstrutura = document.getElementById('barEstrutura');
        const barConteudo = document.getElementById('barConteudo');
        const barFormacao = document.getElementById('barFormacao');
        const barExperiencia = document.getElementById('barExperiencia');
        const scoreEstrutura = document.getElementById('scoreEstrutura');
        const scoreConteudo = document.getElementById('scoreConteudo');
        const scoreFormacao = document.getElementById('scoreFormacao');
        const scoreExperiencia = document.getElementById('scoreExperiencia');

        if (barEstrutura && scoreEstrutura) {
            const estruturaScore = Math.round(factors.estrutura);
            scoreEstrutura.textContent = estruturaScore;
            setTimeout(() => { barEstrutura.style.height = estruturaScore + '%'; }, 200);
        }
        if (barConteudo && scoreConteudo) {
            const conteudoScore = Math.round(factors.conteudo);
            scoreConteudo.textContent = conteudoScore;
            setTimeout(() => { barConteudo.style.height = conteudoScore + '%'; }, 400);
        }
        if (barFormacao && scoreFormacao) {
            const formacaoScore = Math.round(factors.formacao);
            scoreFormacao.textContent = formacaoScore;
            setTimeout(() => { barFormacao.style.height = formacaoScore + '%'; }, 600);
        }
        if (barExperiencia && scoreExperiencia) {
            const experienciaScore = Math.round(factors.experiencia);
            scoreExperiencia.textContent = experienciaScore;
            setTimeout(() => { barExperiencia.style.height = experienciaScore + '%'; }, 800);
        }

        // INTEGRAÇÃO GEMINI AI: Resumo Global e Pontos Fortes (REAL DATA)
        const geminiSummary = document.getElementById('geminiGlobalSummary');
        const aiStrengths = document.getElementById('aiStrengths');

        if (geminiSummary && aiStrengths) {
            // Usar dados reais do Gemini se disponíveis
            if (this.geminiAnalysis && this.geminiAnalysis.summary) {
                // ✅ DADOS REAIS DO GEMINI BACKEND
                geminiSummary.innerHTML = `<p style="margin: 0;">${this.geminiAnalysis.summary}</p>`;

                // Pontos Fortes do Gemini
                if (this.geminiAnalysis.strengths && this.geminiAnalysis.strengths.length > 0) {
                    aiStrengths.innerHTML = this.geminiAnalysis.strengths.map(s =>
                        `<li class="mb-1">• ${s}</li>`
                    ).join('');
                } else {
                    aiStrengths.innerHTML = '<li class="text-muted">Análise AI em processamento...</li>';
                }

                console.log('[GEMINI] UI atualizada com dados reais');
            } else {
                // Fallback:  local analysis if Gemini unavailable
                console.warn('[GEMINI] Backend não disponível, usando análise local');
                geminiSummary.innerHTML = `
                <p style="margin: 0;">Candidato com <strong>${data.yearsExperience} anos de experiência</strong> na área de <strong>${data.mainArea}</strong>, 
                demonstrando nível de senioridade <strong>${data.seniorityLevel}</strong>. 
                O CV apresenta estrutura ${factors.estrutura >= 70 ? 'bem organizada' : 'com margem para otimização'} 
                e ${factors.impacto >= 60 ? 'forte foco em resultados' : 'pode beneficiar de maior ênfase em conquistas quantificáveis'}.</p>
            `;

                // Pontos Fortes baseados na análise local (fallback)
                const strengths = [];
                if (data.hardSkills.length >= 5) strengths.push('Portfolio diversificado de competências técnicas');
                if (data.experiences.length >= 3) strengths.push('Progressão de carreira clara e consistente');
                if (factors.formacao >= 70) strengths.push('Formação académica sólida e atualizada');
                if (data.languages.length >= 2) strengths.push(`Multilinguismo (${data.languages.length} idiomas)`);
                if (ats.score >= 75) strengths.push('CV bem otimizado para sistemas ATS');

                if (strengths.length > 0) {
                    aiStrengths.innerHTML = strengths.slice(0, 4).map(s => `<li class="mb-1">• ${s}</li>`).join('');
                } else {
                    aiStrengths.innerHTML = '<li class="text-muted">A identificar pontos fortes...</li>';
                }
            }
        }

        // BLOCO 4: Competências Detetadas
        const hardSkillsList = document.getElementById('hardSkillsList');
        const softSkillsList = document.getElementById('softSkillsList');
        const languagesList = document.getElementById('languagesList');

        if (hardSkillsList) {
            hardSkillsList.textContent = data.hardSkills.length > 0
                ? data.hardSkills.slice(0, 5).join(', ')
                : 'Não identificadas - adicionar secção de competências';
        }
        if (softSkillsList) {
            softSkillsList.textContent = data.softSkills.length > 0
                ? data.softSkills.slice(0, 5).join(', ')
                : 'Não identificadas explicitamente';
        }
        if (languagesList) {
            languagesList.textContent = data.languages.length > 0
                ? data.languages.map(l => `${l.name} (${l.level})`).join(', ')
                : 'Não identificados - adicionar secção de idiomas';
        }

        // BLOCO 5: Formação e Atualização
        const lastEducation = document.getElementById('lastEducation');
        const updateRhythm = document.getElementById('updateRhythm');

        if (lastEducation) {
            lastEducation.textContent = data.lastEducationYear || 'Não detetado';
        }
        if (updateRhythm) {
            const currentYear = new Date().getFullYear();
            const gap = data.lastEducationYear ? currentYear - data.lastEducationYear : 999;
            if (gap <= 2) updateRhythm.textContent = 'Muito Ativo';
            else if (gap <= 4) updateRhythm.textContent = 'Ativo';
            else if (gap <= 6) updateRhythm.textContent = 'Moderado';
            else updateRhythm.textContent = 'Necessita Atualização';
        }

        // INTEGRAÇÃO GEMINI: Training Relevance Analysis
        if (this.geminiAnalysis && this.geminiAnalysis.training_relevance) {
            const trainingSection = document.getElementById('trainingRelevanceSection');
            const trainingScore = document.getElementById('trainingScore');
            const trainingAssessment = document.getElementById('trainingAssessment');
            const alignedCoursesDiv = document.getElementById('alignedCoursesDiv');
            const alignedCoursesList = document.getElementById('alignedCoursesList');
            const recommendedCoursesDiv = document.getElementById('recommendedCoursesDiv');
            const recommendedCoursesList = document.getElementById('recommendedCoursesList');

            const tr = this.geminiAnalysis.training_relevance;

            if (trainingSection) trainingSection.style.display = 'block';
            if (trainingScore) trainingScore.textContent = `${tr.score || 0}/100`;
            if (trainingAssessment) trainingAssessment.textContent = tr.assessment || 'Análise não disponível';

            // Cursos alinhados
            if (tr.aligned_courses && tr.aligned_courses.length > 0) {
                if (alignedCoursesDiv) alignedCoursesDiv.style.display = 'block';
                if (alignedCoursesList) {
                    alignedCoursesList.innerHTML = tr.aligned_courses.map(course => `<li>${course}</li>`).join('');
                }
            }

            // Cursos recomendados
            if (tr.recommended_courses && tr.recommended_courses.length > 0) {
                if (recommendedCoursesDiv) recommendedCoursesDiv.style.display = 'block';
                if (recommendedCoursesList) {
                    recommendedCoursesList.innerHTML = tr.recommended_courses.map(course => `<li>${course}</li>`).join('');
                }
            }

            console.log('[GEMINI] Training relevance populated:', tr);
        }

        // BLOCO 6: Estrutura e ATS - AGORA COM ANÁLISE ISOLADA
        const atsCompat = document.getElementById('atsCompat');
        const cvStructure = document.getElementById('cvStructure');
        const readability = document.getElementById('readability');

        if (atsCompat) {
            atsCompat.innerHTML = `<strong style="color: ${this.getATSColor(ats.score)}">${ats.score}/100</strong> (${ats.level})`;
        }
        if (cvStructure) {
            const structScore = factors.estrutura;
            cvStructure.textContent = structScore >= 70 ? 'Clara e Organizada' : structScore >= 50 ? 'Adequada' : 'Necessita Melhoria';
        }
        if (readability) {
            readability.textContent = factors.conteudo >= 70 ? 'Boa' : factors.conteudo >= 50 ? 'Média' : 'A Melhorar';
        }

        // Radar chart removed - usando apenas barras verticais

        // Renderizar secção ATS detalhada (se existir container)
        this.renderATSSection();
    },

    /**
     * Obter cor baseada no score ATS
     */
    getATSColor(score) {
        if (score >= 90) return '#28a745'; // Verde
        if (score >= 75) return '#5cb85c'; // Verde claro
        if (score >= 50) return '#BF9A33'; // Dourado
        if (score >= 25) return '#f0ad4e'; // Laranja
        return '#dc3545'; // Vermelho
    },

    /**
     * Renderizar secção ATS detalhada
     */
    renderATSSection() {
        const ats = this.data.atsAnalysis;
        const atsColor = this.getATSColor(ats.score);

        // Atualizar score e badge
        const scoreDisplay = document.getElementById('atsScoreDisplay');
        const levelBadge = document.getElementById('atsLevelBadge');
        const atsSection = document.getElementById('atsDetailedSection');

        if (scoreDisplay) {
            scoreDisplay.textContent = ats.score;
            scoreDisplay.style.color = atsColor;
        }

        if (levelBadge) {
            levelBadge.textContent = `Compatibilidade ${ats.level}`;
            levelBadge.style.background = atsColor;
        }

        if (atsSection) {
            atsSection.style.borderColor = atsColor;
        }

        // Animar barra de progresso ATS
        const atsProgressBar = document.getElementById('atsProgressBar');
        if (atsProgressBar) {
            // Definir cor baseada no score
            atsProgressBar.style.background = `linear-gradient(90deg, ${atsColor} 0%, ${atsColor} 100%)`;
            setTimeout(() => {
                atsProgressBar.style.width = ats.score + '%';
            }, 100);
        }

        // Atualizar bullets de diagnóstico
        const bulletsList = document.getElementById('atsLevelBullets');
        if (bulletsList && ats.levelBullets) {
            let bulletsHTML = '';
            ats.levelBullets.forEach(b => {
                bulletsHTML += `<li style="margin-bottom: 6px; font-size: 0.85rem; color: #495057;">• ${b}</li>`;
            });
            bulletsList.innerHTML = bulletsHTML;
        }

        // Atualizar gatilhos
        const triggersList = document.getElementById('atsTriggersList');
        if (triggersList && ats.triggers) {
            let triggersHTML = '';
            ats.triggers.forEach(t => {
                const icon = t.positive ? '✓' : '✗';
                const color = t.positive ? '#28a745' : '#dc3545';
                triggersHTML += `<div style="display: flex; align-items: start; gap: 8px; margin-bottom: 6px;">
                    <span style="color: ${color}; font-weight: bold; font-size: 1rem;">${icon}</span>
                    <span style="font-size: 0.85rem; color: #495057;">${t.text}</span>
                </div>`;
            });
            triggersList.innerHTML = triggersHTML;
        }
    },

    /**
     * Obter dados para geração de relatório PDF
     */
    getReportData() {
        return {
            ...this.data.extractedData,
            maturity: this.data.maturity,
            spiderFactors: this.data.spiderFactors,
            atsAnalysis: this.data.atsAnalysis
        };
    },

    /**
     * Validar tipo de documento para rejeitar cartões de cidadão e outros documentos não-CV
     */
    validateDocumentType(text, originalText) {
        console.log('[CV_ENGINE] 🔍 Validando tipo de documento...');

        // Red flags para documentos não-CV (ID cards, drivers license, passports, etc)
        const nonCVKeywords = {
            pt: [
                'cartão de cidadão', 'número de cidadão', 'cc n.º', 'nif', 'número de identificação fiscal',
                'carta de condução', 'alvará', 'licença', 'autoridade emissora', 'validade até',
                'data de nascimento', 'filiação', 'naturalidade', 'altura', 'sexo masculino', 'sexo feminino',
                'assinatura do titular', 'estado civil', 'país de nascimento'
            ],
            en: [
                'citizen card', 'citizen number', 'national id', 'identity card', 'id card number',
                'driving license', 'driver\'s license', 'issuing authority', 'valid until', 'expires',
                'date of birth', 'place of birth', 'nationality', 'marital status', 'height', 'gender',
                'passport number', 'signature of holder'
            ]
        };

        // Green flags para CVs reais
        const cvKeywords = {
            pt: [
                'experiência profissional', 'experiências profissionais', 'percurso profissional',
                'formação académica', 'formação', 'educação', 'competências', 'habilidades',
                'curriculum vitae', 'currículo', 'perfil profissional', 'objetivo profissional',
                'hard skills', 'soft skills', 'certificações', 'idiomas', 'línguas',
                'projetos', 'voluntariado', 'publicações', 'conquistas'
            ],
            en: [
                'professional experience', 'work experience', 'employment history', 'career summary',
                'education', 'academic background', 'qualifications', 'skills', 'competencies',
                'curriculum vitae', 'resume', 'professional profile', 'career objective',
                'hard skills', 'soft skills', 'certifications', 'languages', 'projects',
                'volunteer work', 'publications', 'achievements', 'references'
            ]
        };

        const lowerText = text;
        const wordCount = text.split(/\s+/).length;
        const allNonCVKeywords = [...nonCVKeywords.pt, ...nonCVKeywords.en];
        const allCVKeywords = [...cvKeywords.pt, ...cvKeywords.en];

        // Contar red flags
        const nonCVMatches = allNonCVKeywords.filter(k => lowerText.includes(k.toLowerCase()));
        const nonCVScore = nonCVMatches.length;

        // Contar green flags
        const cvMatches = allCVKeywords.filter(k => lowerText.includes(k.toLowerCase()));
        const cvScore = cvMatches.length;

        console.log('[CV_ENGINE] 📊 Validação:', {
            nonCVScore,
            cvScore,
            wordCount,
            nonCVMatches: nonCVMatches.slice(0, 5),
            cvMatches: cvMatches.slice(0, 5)
        });

        // Regra 1: Se tem 3+ red flags, é quase certamente um ID card
        if (nonCVScore >= 3) {
            console.error('[CV_ENGINE] ❌ Documento rejeitado: Detetado como cartão de cidadão ou documento oficial');
            throw new Error('INVALID_DOCUMENT_TYPE');
        }

        // Regra 2 MELHORADA: Verificar se tem conteúdo mínimo de CV
        // Um CV DEVE ter pelo menos UMA das seguintes combinações:
        // - Experiência profissional OU Formação académica
        // E também:
        // - Competências/Skills

        const hasExperience = cvMatches.some(m =>
            m.includes('experiência') || m.includes('experience') ||
            m.includes('profissional') || m.includes('professional') ||
            m.includes('employment') || m.includes('work')
        );

        const hasEducation = cvMatches.some(m =>
            m.includes('formação') || m.includes('educação') || m.includes('education') ||
            m.includes('académica') || m.includes('academic')
        );

        const hasSkills = cvMatches.some(m =>
            m.includes('competências') || m.includes('skills') ||
            m.includes('habilidades') || m.includes('competencies')
        );

        const hasCVCore = (hasExperience || hasEducation) && hasSkills;

        if (!hasCVCore && wordCount >= 100) {
            console.error('[CV_ENGINE] ❌ Documento rejeitado: Sem estrutura mínima de CV (experiência/formação + competências)');
            throw new Error('MISSING_CV_CONTENT');
        }

        // Regra 3: Se é muito curto E não tem green flags
        if (cvScore === 0 && wordCount < 150) {
            console.error('[CV_ENGINE] ❌ Documento rejeitado: Demasiado curto e sem indicadores de CV');
            throw new Error('DOCUMENT_TOO_SHORT');
        }

        // Regra 4: Se ratio red/green é muito alto, suspeito
        if (nonCVScore > 0 && cvScore > 0 && (nonCVScore / cvScore) > 2) {
            console.warn('[CV_ENGINE] ⚠️ Documento suspeito: Muitos indicadores não-CV');
            throw new Error('SUSPICIOUS_DOCUMENT');
        }

        console.log('[CV_ENGINE] ✅ Documento validado como CV');
        return true;
    }
};


