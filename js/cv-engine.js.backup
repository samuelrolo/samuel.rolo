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
            this.updateUI();

            console.log('[CV_ENGINE] Analysis complete. Score:', this.data.maturity.score);
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
                detail: `Utiliza ${impactCount} verbos de ação que demonstram resultados concretos.`
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
                context: "Adicione mais resultados mensuráveis. Ex: 'Aumentei vendas em 20%', 'Reduzi custos em 15K€'."
            });
        }

        if (this.data.competencies.ats < 70) {
            this.data.suggestions.push({
                title: "Otimizar para Sistemas ATS",
                context: "Inclua mais keywords relevantes da sua área e certifique-se que os dados de contacto estão visíveis."
            });
        }

        if (sectionsCount < 5) {
            this.data.suggestions.push({
                title: "Completar Secções Fundamentais",
                context: "Adicione secções como: Experiência, Formação, Competências, Certificações e Línguas."
            });
        }

        if (wordCount < 300) {
            this.data.suggestions.push({
                title: "Expandir Conteúdo",
                context: "O CV parece muito resumido. Detalhe as suas responsabilidades e conquistas em cada experiência."
            });
        }
    },

    /**
     * Atualizar UI com os resultados da análise
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

        // Render Lista de Pontos Fortes
        const sList = document.getElementById('strengthsList');
        if (sList) {
            sList.innerHTML = this.data.strengths.map(s => `
                <div class="strength-item mb-3">
                    <h6 class="fw-bold text-dark mb-1">
                        <i class="fas fa-check-circle text-success me-2"></i>${s.title}
                    </h6>
                    <p class="small text-muted mb-0">${s.detail}</p>
                </div>
            `).join('');
        }

        // Render Lista de Sugestões
        const sugList = document.getElementById('suggestionsList');
        if (sugList) {
            sugList.innerHTML = this.data.suggestions.map(s => `
                <div class="suggestion-item mb-3">
                    <h6 class="fw-bold text-dark mb-1">
                        <i class="fas fa-arrow-up text-primary me-2"></i>${s.title}
                    </h6>
                    <p class="small text-muted mb-0">${s.context}</p>
                </div>
            `).join('');
        }
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
