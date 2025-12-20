/**
 * CV Analysis Engine - Share2Inspire
 * Single Source of Truth for Editorial Content
 */

const CV_ENGINE = {
    // Configuration & Rules
    config: {
        forbiddenTerms: ['consultoria', 'formação', 'implementação'],
        minBulletsSugestoes: 6,
        minBulletsFeedback: 5,
        minPagesPDF: 6
    },

    /**
     * Structure of the Central Data Object (JSON)
     * This is what feeds the UI, PDF, and Email
     */
    data: {
        profile: {
            name: "",
            role: "",
            summary: "",
            years_metric: "0" // "12 anos"
        },
        maturity: {
            level: "", // "Senior Management"
            score: 0.0,
            stars: 0
        },
        competencies: [], // ["Liderança", "Estratégia"]
        strengths: [], // ["Gestão de Mudança", ...]
        radar: {
            labels: ["Estratégia", "Pessoas", "Processos", "Tecnologia", "Liderança", "Cultura"],
            data: [0, 0, 0, 0, 0, 0]
        },
        // [SCREEN] Resumo -> [PDF] Expandido
        evolution: [
            // { title: "", context: "", evidence: "", actions: ["", ""] }
        ],
        // [SCREEN] Resumo -> [PDF] Expandido
        feedback: [
            // { title: "", market_reading: "", recommendations: ["", ""] }
        ]
    },

    /**
     * Validate content against editorial rules
     */
    validateEditorial: function (text) {
        if (!text) return false;
        const lowerText = text.toLowerCase();
        for (let term of this.config.forbiddenTerms) {
            if (lowerText.includes(term)) {
                console.warn(`Editorial Warning: Termo proibido '${term}' encontrado.`);
                return false;
            }
        }
        return true;
    },

    /**
     * Mock Analysis Generation (Replace with real AI parser later)
     */
    generateMockAnalysis: function () {
        this.data.maturity.score = 4.2;
        this.data.maturity.level = "Senior Management";
        this.data.radar.data = [4, 5, 3, 2, 5, 4];

        // Populate Evolution (Strategic Bullets)
        this.data.evolution = [
            {
                title: "Reforço do Posicionamento Global",
                context: "O perfil demonstra forte competência local, mas o mercado atual valoriza a exposição internacional para funções deste nível.",
                evidence: "Experiência concentrada em Portugal (90%).",
                actions: ["Liderar projetos cross-border.", "Publicar artigos em inglês no LinkedIn."]
            },
            {
                title: "Digital Mindset em RH",
                context: "A transformação digital é um requisito obrigatório. O perfli mostra experiência clássica mas pouca exposição a HR Tech.",
                evidence: "Ausência de menção a ATS ou ferramentas de AI.",
                actions: ["Certificação em HR Analytics.", "Pilotar um projeto de digitalização."]
            },
            {
                title: "Liderança de Influência",
                context: "Para ascender a C-Level, é necessário demonstrar capacidade de influenciar sem autoridade formal.",
                evidence: "Gestão de equipas diretas, mas sem projetos transversais claros.",
                actions: ["Mentoria de pares.", "Liderar comités de ética ou diversidade."]
            },
            {
                title: "Gestão Financeira",
                context: "O acumen comercial é vital. Falta evidência de gestão de P&L.",
                evidence: "Sem menção a orçamentos.",
                actions: ["Gerir orçamento de departamento.", "Apresentar ROI de projetos de RH."]
            },
            {
                title: "Agilidade Organizacional",
                context: "Metodologias ágeis são o padrão em empresas de topo.",
                evidence: "Perfil tradicional em waterfall.",
                actions: ["Certificação Scrum Master ou Product Owner.", "Implementar squads."]
            },
            {
                title: "Networking Estratégico",
                context: "A rede de contactos deve ser ativa e não apenas reativa.",
                evidence: "Presença moderada no LinkedIn.",
                actions: ["Participar em painéis de conferências.", "Criar newsletter mensal."]
            }
        ];

        // Populate Feedback
        this.data.feedback = [
            {
                title: "Elevada Maturidade de Gestão",
                market_reading: "O mercado procura líderes estaveis. O perfil oferece essa segurança.",
                recommendations: ["Capitalizar na experiência de gestão de crise.", "Posicionar-se como 'Safe Hands'."]
            },
            {
                title: "Gap Tecnológico",
                market_reading: "O mercado está a penalizar perfis desconectados da IA.",
                recommendations: ["Atualização urgente em GenAI.", "Workshop de automação."]
            },
            {
                title: "Potencial de Board Member",
                market_reading: "Existe base para conselheiro, falta visibilidade.",
                recommendations: ["Formação em Corporate Governance.", "Procurar posições não executivas."]
            },
            {
                title: "Comunicação Executiva",
                market_reading: "Clareza é poder. O CV original é denso.",
                recommendations: ["Simplificar discurso.", "Focar em resultados, não tarefas."]
            },
            {
                title: "Marca Pessoal",
                market_reading: "A marca 'Samuel' precisa de se destacar da marca 'Empresa'.",
                recommendations: ["Desenvolver voz própria.", "Storytelling pessoal."]
            }
        ];
    },

    /**
     * Check if PDF generation meets the "6 Page Real Content" criteria
     */
    canGeneratePremiumPDF: function () {
        // Simple heuristic: Do we have enough bullets to expand?
        if (this.data.evolution.length < this.config.minBulletsSugestoes) return false;
        if (this.data.feedback.length < this.config.minBulletsFeedback) return false;
        return true;
    },
    /**
     * Bridge: Scrape data from DOM (populated by legacy JS) into Engine
     */
    scrapeFromDOM: function () {
        try {
            // Profile
            this.data.profile.name = document.getElementById('resultName')?.innerText || "";
            this.data.profile.role = document.getElementById('resultRole')?.innerText || "";
            this.data.profile.years_metric = document.getElementById('resultExp')?.innerText || "0 anos";
            this.data.profile.summary = document.getElementById('recommendationText')?.innerText || "";

            // Maturity
            this.data.maturity.score = document.getElementById('maturityScore')?.innerText || "0.0";
            this.data.maturity.level = document.getElementById('maturityLabel')?.innerText || "Em Análise";

            // Competencies
            if (document.getElementById('skillsContainer')) {
                const skillNodes = document.querySelectorAll('#skillsContainer span');
                this.data.competencies = Array.from(skillNodes).map(node => node.innerText);
            }

            // Strengths
            if (document.getElementById('strengthsList')) {
                const strengthNodes = document.querySelectorAll('#strengthsList li');
                this.data.strengths = Array.from(strengthNodes).map(node => node.innerText);
            }

            console.log("CV Engine: Data scraped from DOM.", this.data);
            return true;
        } catch (e) {
            console.error("CV Engine: Error scraping DOM", e);
            return false;
        }
    }
};

// Export for use
window.CV_ENGINE = CV_ENGINE;
