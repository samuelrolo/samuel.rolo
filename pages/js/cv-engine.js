/**
 * CV Engine - Share2Inspire
 * Data management and analysis engine for CV analysis
 */

window.CV_ENGINE = {
    data: {
        maturity: {
            score: 0,
            label: 'Em Análise',
            color: '#BF9A33'
        },
        skills: [],
        strengths: [],
        suggestions: [],
        competencies: {
            ats: 0,
            impact: 0,
            structure: 0,
            market: 0,
            positioning: 0
        },
        personalInfo: {
            name: '',
            email: '',
            phone: ''
        },
        rawAnalysis: null
    },

    /**
     * Initialize engine with analysis data from backend
     */
    init(analysisData) {
        if (!analysisData) {
            console.warn('[CV_ENGINE] No analysis data provided');
            return;
        }

        this.data.rawAnalysis = analysisData;

        // Parse maturity score
        if (analysisData.nível_maturidade) {
            this.data.maturity.score = parseFloat(analysisData.nível_maturidade) || 0;
            this.data.maturity.label = this.getMaturityLabel(this.data.maturity.score);
        }

        // Parse competencies
        if (analysisData.competências_principais) {
            this.data.skills = analysisData.competências_principais;
        }

        // Parse strengths
        if (analysisData.pontos_fortes) {
            this.data.strengths = analysisData.pontos_fortes;
        }

        // Parse suggestions
        if (analysisData.sugestões_evolução) {
            this.data.suggestions = analysisData.sugestões_evolução;
        }

        // Parse radar data
        if (analysisData.radar_competências) {
            const radar = analysisData.radar_competências;
            this.data.competencies = {
                ats: radar.compatibilidade_ats || 0,
                impact: radar.impacto_conteudo || 0,
                structure: radar.estrutura_design || 0,
                market: radar.fit_mercado || 0,
                positioning: radar.posicionamento || 0
            };
        }

        console.log('[CV_ENGINE] Initialized with data:', this.data);
    },

    /**
     * Get maturity label based on score
     */
    getMaturityLabel(score) {
        if (score >= 4.5) return 'Excelente';
        if (score >= 4.0) return 'Muito Bom';
        if (score >= 3.5) return 'Bom';
        if (score >= 3.0) return 'Adequado';
        if (score >= 2.0) return 'A Melhorar';
        return 'Inicial';
    },

    /**
     * Scrape data from DOM elements populated by legacy cv-analysis.js
     */
    scrapeFromDOM() {
        // Scrape maturity score
        const scoreEl = document.querySelector('.maturity-score');
        if (scoreEl) {
            this.data.maturity.score = parseFloat(scoreEl.textContent) || 0;
            this.data.maturity.label = this.getMaturityLabel(this.data.maturity.score);
        }

        // Scrape skills
        const skillTags = document.querySelectorAll('.skill-tag');
        this.data.skills = Array.from(skillTags).map(el => el.textContent.trim());

        // Scrape strengths
        const strengthItems = document.querySelectorAll('.strength-item');
        this.data.strengths = Array.from(strengthItems).map(el => el.textContent.trim());

        // Scrape suggestions
        const suggestionItems = document.querySelectorAll('.suggestion-item');
        this.data.suggestions = Array.from(suggestionItems).map(el => el.textContent.trim());

        console.log('[CV_ENGINE] Scraped from DOM:', this.data);
    },

    /**
     * Generate mock analysis for testing/demonstration
     */
    generateMockAnalysis() {
        this.data = {
            maturity: {
                score: 4.5,
                label: 'Muito Bom',
                color: '#BF9A33'
            },
            skills: [
                'Transformação Digital',
                'RH Digital',
                'Inteligência Artificial (IA) Responsável',
                'Gestão da Mudança (Change Management)',
                'Design Organizacional',
                'Estratégia HRIS (SAP SF, SN)',
                'Liderança de Pensamento',
                'Negociação Avançada'
            ],
            strengths: [
                'Sólida experiência em Consultoria Estratégica (Deloitte, EY) combinada com experiência corporativa.',
                'Posicionamento único e relevante no nicho de Transformação Digital de RH e IA.',
                'Marca pessoal robusta (LinkedIn Top Voice, Autor de livro, orador para funções de liderança e influência).',
                'Experiência de liderança global comprovada (20,000 colaboradores em 15+ países).'
            ],
            suggestions: [
                'Considere adicionar métricas quantitativas aos achievements',
                'Reforce a secção de formação com certificações relevantes',
                'Adicione projetos específicos com impacto mensurável',
                'Atualize o sumário executivo com proposta de valor clara'
            ],
            competencies: {
                ats: 85,
                impact: 90,
                structure: 80,
                market: 88,
                positioning: 92
            },
            personalInfo: {
                name: 'Candidato',
                email: '',
                phone: ''
            },
            rawAnalysis: null
        };
        console.log('[CV_ENGINE] Generated mock analysis');
    }
};
