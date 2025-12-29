/**
 * CV Engine - Share2Inspire (Versão Real com Leitura de Ficheiros)
 * Integração com PDF.js e Mammoth.js para análise real de CVs
 */
window.CV_ENGINE = {
    data: {
        maturity: { score: 0, label: 'Em Análise' },
        competencies: { ats: 0, impact: 0, structure: 0, market: 0, positioning: 0 },
        personalInfo: { name: 'Candidato', role: 'Profissional' },
        strengths: [],
        suggestions: [],
        rawText: ""
    },

    // Dicionários para análise heurística
    dictionaries: {
        impact: ['liderei', 'aumentei', 'crescimento', 'roi', 'kpi', 'budget', 'poupança', 'implementei', 'estratégia', 'geriu', 'lancei', 'otimizei', 'desenvolvi', 'criei'],
        softSkills: ['comunicação', 'equipa', 'liderança', 'negociação', 'resiliência', 'criatividade', 'empatia', 'colaboração'],
        sections: ['experiência', 'educação', 'formação', 'contactos', 'resumo', 'skills', 'competências', 'línguas', 'certificações'],
        keywords: ['project', 'team', 'manager', 'lead', 'digital', 'strategy', 'data', 'analytics', 'innovation']
    },

    /**
     * Função principal chamada pelo botão "Analisar" no HTML
     * @param {File} file - Ficheiro PDF ou DOCX carregado pelo utilizador
     */
    async analyzeFile(file) {
        try {
            console.log('[CV_ENGINE] Starting file analysis:', file.name, file.type);

            if (file.type === 'application/pdf') {
                this.data.rawText = await this.readPDF(file);
            } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                this.data.rawText = await this.readDOCX(file);
            } else {
                throw new Error('Formato não suportado. Utilize PDF ou DOCX.');
            }

            // Processar os dados reais extraídos
            this.runHeuristics(this.data.rawText);

            // Extrair dados expandidos para PDF profissional
            const expandedData = this.extractExpandedData(this.data.rawText);
            this.data.personalInfo = {
                ...this.data.personalInfo,
                ...expandedData
            };

            this.updateUI();

            console.log('[CV_ENGINE] Analysis complete. Score:', this.data.maturity.score);
            console.log('[CV_ENGINE] Expanded data:', expandedData);
            return true; // Sucesso
        } catch (error) {
            console.error('[CV_ENGINE] Error during analysis:', error);
            throw error; // Propagar erro para o handler
        }
    },

    /**
     * Leitura de PDF usando PDF.js
     * @param {File} file - Ficheiro PDF
     * @returns {Promise<string>} Texto extraído do PDF
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

        return text.toLowerCase();
    },

    /**
     * Leitura de DOCX usando Mammoth.js
     * @param {File} file - Ficheiro DOCX
     * @returns {Promise<string>} Texto extraído do DOCX
     */
    async readDOCX(file) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        return result.value.toLowerCase();
    },

    /**
     * Motor de análise heurística (substitui backend AI)
     * Analisa o texto extraído e calcula scores
     * @param {string} text - Texto do CV em lowercase
     */
    runHeuristics(text) {
        // Contar palavras-chave de impacto
        const countImpact = this.dictionaries.impact.reduce((acc, word) =>
            acc + (text.includes(word) ? 1 : 0), 0);

        // Contar secções estruturais
        const countSections = this.dictionaries.sections.reduce((acc, word) =>
            acc + (text.includes(word) ? 1 : 0), 0);

        // Contar keywords técnicas
        const countKeywords = this.dictionaries.keywords.reduce((acc, word) =>
            acc + (text.includes(word) ? 1 : 0), 0);

        // Calcular métricas de tamanho
        const wordCount = text.split(/\s+/).length;
        const hasEmail = text.includes('@');
        const hasPhone = /\d{9}/.test(text);

        // === CÁLCULO DOS SCORES (0-100) ===

        // 1. IMPACTO: Baseado em verbos de ação e resultados
        this.data.competencies.impact = Math.min(100, Math.round((countImpact / 7) * 100));

        // 2. ESTRUTURA: Baseado em secções encontradas
        this.data.competencies.structure = Math.min(100, Math.round((countSections / 7) * 100));

        // 3. ATS: Tamanho, keywords e dados de contacto
        let atsScore = 20; // Base
        if (wordCount > 300) atsScore += 30;
        if (wordCount > 500) atsScore += 20;
        if (hasEmail) atsScore += 15;
        if (hasPhone) atsScore += 15;
        this.data.competencies.ats = Math.min(100, atsScore);

        // 4. MERCADO: Baseado em keywords técnicas + impacto
        this.data.competencies.market = Math.min(100,
            Math.round((countKeywords / 5) * 50 + this.data.competencies.impact * 0.5));

        // 5. POSICIONAMENTO: Média estrutura + impacto
        this.data.competencies.positioning = Math.min(100,
            Math.round((this.data.competencies.structure + this.data.competencies.impact) / 2));

        // === SCORE GLOBAL (0-10) ===
        const avg = (
            this.data.competencies.ats +
            this.data.competencies.impact +
            this.data.competencies.structure +
            this.data.competencies.market +
            this.data.competencies.positioning
        ) / 5;

        this.data.maturity.score = (avg / 10).toFixed(1);

        // Definir Label
        if (this.data.maturity.score >= 8) this.data.maturity.label = 'Especialista';
        else if (this.data.maturity.score >= 6) this.data.maturity.label = 'Avançado';
        else if (this.data.maturity.score >= 4) this.data.maturity.label = 'Intermédio';
        else this.data.maturity.label = 'Iniciante';

        // Gerar Feedback Dinâmico
        this.generateFeedback(countImpact, countSections, wordCount);
    },

    /**
     * Gerar feedback personalizado (Pontos Fortes + Sugestões)
     * @param {number} impactCount - Número de palavras de impacto encontradas
     * @param {number} sectionsCount - Número de secções encontradas
     * @param {number} wordCount - Total de palavras no CV
     */
    generateFeedback(impactCount, sectionsCount, wordCount) {
        this.data.strengths = [];
        this.data.suggestions = [];

        // === PONTOS FORTES ===
        if (impactCount >= 5) {
            this.data.strengths.push({
                title: "Vocabulário de Alto Impacto",
                detail: `Utilizas ${impactCount} verbos de ação que demonstram resultados concretos.`
            });
        }

        if (sectionsCount >= 5) {
            this.data.strengths.push({
                title: "Estrutura Clara e Completa",
                detail: "As secções principais estão bem definidas, facilitando a leitura."
            });
        }

        if (wordCount >= 500) {
            this.data.strengths.push({
                title: "Conteúdo Detalhado",
                detail: "O CV apresenta informação suficiente para uma avaliação completa."
            });
        }

        // === SUGESTÕES DE MELHORIA ===
        if (impactCount < 5) {
            this.data.suggestions.push({
                title: "Aumentar Impacto Quantificável",
                context: "Adiciona mais resultados mensuráveis. Ex: 'Aumentei vendas em 20%', 'Reduzi custos em 15K€'."
            });
        }

        if (this.data.competencies.ats < 70) {
            this.data.suggestions.push({
                title: "Otimizar para Sistemas ATS",
                context: "Inclui mais keywords relevantes da tua área e certifica-te que os dados de contacto estão visíveis."
            });
        }

        if (sectionsCount < 5) {
            this.data.suggestions.push({
                title: "Completar Secções Fundamentais",
                context: "Adiciona secções como: Experiência, Formação, Competências, Certificações e Línguas."
            });
        }

        if (wordCount < 300) {
            this.data.suggestions.push({
                title: "Expandir Conteúdo",
                context: "O CV parece muito resumido. Detalha as tuas responsabilidades e conquistas em cada experiência."
            });
        }
    },

    /**
     * Atualizar UI com os resultados da análise (MODO TEASER SIMPLIFICADO)
     */
    updateUI() {
        // Update Maturity Score
        const scoreElement = document.getElementById('maturityScore');
        if (scoreElement) scoreElement.innerText = this.data.maturity.score;

        const labelElement = document.getElementById('maturityLabel');
        if (labelElement) labelElement.innerText = this.data.maturity.label;

        // Update Radar Chart se a função existir
        if (window.renderRadarChart) {
            window.renderRadarChart(this.data.competencies);
        }

        // MODO TEASER: Mostrar apenas mensagem de bloqueio sem detalhes
        const sList = document.getElementById('strengthsList');
        if (sList) {
            sList.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-lock fa-3x text-muted mb-3"></i>
                    <p class="text-muted mb-0">
                        <strong>Análise detalhada disponível no relatório completo (1€)</strong>
                    </p>
                    <p class="small text-muted">Pontos fortes, sugestões estratégicas e plano de ação</p>
                </div>
            `;
        }

        // MODO TEASER: Apenas mensagem de bloqueio nas sugestões
        const sugList = document.getElementById('suggestionsList');
        if (sugList) {
            sugList.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-lock fa-3x text-muted mb-3"></i>
                    <p class="text-muted mb-0">
                        <strong>Recomendações personalizadas bloqueadas</strong>
                    </p>
                    <p class="small text-muted">Desbloqueia o relatório PDF completo por apenas 1€</p>
                </div>
            `;
        }
    },

    /**
     * Extrair dados expandidos para o PDF profissional
     * Analisa o texto para encontrar idiomas, empresas, datas de formação
     */
    extractExpandedData(text) {
        // Idiomas comuns e seus níveis
        const languagePatterns = {
            'inglês': ['fluente', 'avançado', 'intermédio', 'básico', 'nativo'],
            'espanhol': ['fluente', 'avançado', 'intermédio', 'básico'],
            'francês': ['fluente', 'avançado', 'intermédio', 'básico'],
            'alemão': ['fluente', 'avançado', 'intermédio', 'básico'],
            'português': ['nativo', 'fluente'],
            'italiano': ['fluente', 'avançado', 'intermédio'],
            'chinês': ['fluente', 'avançado', 'intermédio', 'básico'],
        };

        const languages = [];
        for (const [lang, levels] of Object.entries(languagePatterns)) {
            if (text.includes(lang)) {
                let level = 'Não especificado';
                for (const lvl of levels) {
                    if (text.includes(lvl)) {
                        level = lvl.charAt(0).toUpperCase() + lvl.slice(1);
                        break;
                    }
                }
                languages.push({ name: lang.charAt(0).toUpperCase() + lang.slice(1), level });
            }
        }

        // Empresas conhecidas (top companies)
        const knownCompanies = ['google', 'microsoft', 'amazon', 'deloitte', 'ey', 'pwc', 'kpmg',
            'accenture', 'mckinsey', 'bcg', 'bain', 'salesforce', 'oracle',
            'ibm', 'sap', 'cisco', 'meta', 'facebook', 'apple', 'netflix',
            'astrazeneca', 'bnp paribas', 'hsbc', 'santander', 'citi'];
        const topCompanies = knownCompanies.filter(company => text.includes(company))
            .map(c => c.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
            .slice(0, 3); // Max 3 empresas

        // Anos de experiência (heurística simples)
        const yearMatches = text.match(/(\d{4})\s*-\s*(\d{4}|presente|atual)/gi);
        let totalYears = 0;
        if (yearMatches) {
            yearMatches.forEach(match => {
                const years = match.match(/\d{4}/g);
                if (years && years.length === 2) {
                    totalYears += parseInt(years[1]) - parseInt(years[0]);
                } else if (years && years.length === 1) {
                    totalYears += new Date().getFullYear() - parseInt(years[0]);
                }
            });
        }

        // Última formação/certificação (procurar por datas recentes)
        const currentYear = new Date().getFullYear();
        let lastTraining = null;
        let trainingGap = 0;

        for (let year = currentYear; year >= currentYear - 10; year--) {
            if (text.includes(year.toString()) && (text.includes('certificação') ||
                text.includes('formação') || text.includes('curso'))) {
                lastTraining = year.toString();
                trainingGap = currentYear - year;
                break;
            }
        }

        // Análise crítica de gap
        let criticalAnalysis = '';
        if (trainingGap >= 4) {
            criticalAnalysis = `Não realiza formação formal há ${trainingGap} anos. Numa área em constante mudança, isto representa um risco de obsolescência de competências.`;
        } else if (trainingGap >= 2) {
            criticalAnalysis = `A última formação foi há ${trainingGap} anos. Recomenda-se atualização contínua para manter competitividade no mercado.`;
        }

        // Tópicos chave baseados no conteúdo
        const keyTopics = [];
        if (text.includes('digital') || text.includes('tecnologia')) keyTopics.push('Transformação Digital');
        if (text.includes('dados') || text.includes('analytics')) keyTopics.push('Data Analytics');
        if (text.includes('ia') || text.includes('inteligência artificial')) keyTopics.push('Inteligência Artificial');
        if (text.includes('liderança') || text.includes('gestão')) keyTopics.push('Liderança e Gestão');
        if (text.includes('estratégia')) keyTopics.push('Pensamento Estratégico');

        return {
            languages,
            top_companies: topCompanies,
            total_years_exp: Math.max(1, totalYears), // Mínimo 1 ano
            last_training_date: lastTraining || 'Não detetado',
            training_gap_years: trainingGap,
            critical_analysis: criticalAnalysis,
            main_key_topics: keyTopics.slice(0, 3) // Max 3 tópicos
        };
    },

    /**
     * Trigger payment flow for premium PDF report
     */
    downloadReport() {
        if (window.showPaymentModal) {
            window.showPaymentModal();
        } else {
            console.error('[CV_ENGINE] Payment modal not available');
            alert('Sistema de pagamento não disponível. Por favor, recarregue a página.');
        }
    }
};
